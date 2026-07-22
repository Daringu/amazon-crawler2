import { Injectable } from '@nestjs/common';
import { ProductRepo } from '../repositories/product-repo.service';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { CrawlerProductEntity } from '../entities/product.entity';
import { Page } from 'puppeteer';
import { imitateHuman } from '../utils/immitate-human';
import { extractAmazonAmount } from '../utils/extractAmazonAmount';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';
import { ICrawledLink } from '../types/crawled-links.type';
import { CrawlerCategory } from '../entities/category.entity';

@Injectable()
export class CrawlerProductService {
  constructor(private readonly productRepo: ProductRepo) {}

  async saveProducts(
    products: ICrawlerProduct[],
    marketplace: AMAZON_MARKETPLACES,
    category: CrawlerCategory,
    dataFromLinks: ICrawledLink[],
  ) {
    return await this.productRepo.manager.transaction(async (manager) => {
      // 1️⃣ delete old
      await manager.delete(CrawlerProductEntity, {
        category: { id: category.id },
      });

      const dataMap = new Map<string, ICrawledLink>(
        dataFromLinks.map((link) => [link.asin, link]),
      );

      const entities = products.map((product) => {
        const entity = new CrawlerProductEntity();
        const linkData = dataMap.get(product.asin);

        const dispatchValue =
          (product.dispatchesFrom ?? '-') === (product.soldBy ?? '')
            ? (product.dispatchesFrom ?? '-')
            : `${product.dispatchesFrom ?? '-'} / ${product.soldBy ?? '-'}`;

        if (linkData) {
          entity.rating = linkData.rating ?? 0;
          entity.reviews = linkData.reviews ?? 0;
          entity.rank = linkData.rank ?? null;
        }

        entity.asin = product.asin;
        entity.marketplace = marketplace;
        entity.link = product.link;
        entity.title = product.title ?? null;
        entity.brand = product.brand ?? null;
        entity.price = product.price ?? null;
        entity.reviewCount = product.reviewCount ?? 0;
        entity.stars = product.stars ?? 0;
        entity.videoCount = product.videoCount ?? null;
        entity.amazonChoice = product.amazonChoice ?? false;
        entity.withAPlusContent = product.withAPlusContent ?? false;
        entity.customerSay = product.customerSay ?? null;
        entity.imageCount = product.imageCount ?? 0;
        entity.imagesLinks = product.imagesLinks ?? [];
        entity.variations = product.variations ?? [];
        entity.soldBy = product.soldBy ?? null;
        entity.dispatchesFrom = product.dispatchesFrom ?? null;
        entity.boughtForTheLastMonth =
          extractAmazonAmount(product.boughtForTheLastMonth ?? '') ?? null;
        entity.category = category;
        entity.RRP = product.RRP;
        entity.dispatchInfo = dispatchValue;
        entity.totalVariations = product.variations.reduce(
          (prev, curr) => prev * curr,
          1,
        );

        return entity;
      });

      // 2️⃣ save new
      return await manager.save(CrawlerProductEntity, entities);
    });
  }

  async crawlProductLinks(page: Page): Promise<(ICrawledLink | null)[]> {
    const links: (ICrawledLink | null)[] = [];

    while (true) {
      const startTime = Date.now();
      while (Date.now() - startTime < 3000) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise((res) => setTimeout(res, 200));
      }

      const { productsOnPage, hasNextPage } = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-asin]'));

        const products = items
          .map((el) => {
            const asin = el.getAttribute('data-asin');
            if (!asin) return null;

            const link = el.querySelector('a')?.href ?? null;

            // rank "#1" -> 1
            const rankText = el
              .querySelector('.zg-bdg-text')
              ?.textContent?.trim();
            const rank = rankText ? Number(rankText.replace('#', '')) : null;

            // rating "4.3 out of 5 stars" -> 4.3
            const ratingMatch = el
              .querySelector('.a-icon-alt')
              ?.textContent?.match(/[\d.]+/);
            const rating = ratingMatch ? Number(ratingMatch[0]) : null;

            // reviews "267,506" -> 267506
            const reviewsText = el
              .querySelector('.a-size-small')
              ?.textContent?.replace(/[^\d]/g, '');
            const reviews = reviewsText ? Number(reviewsText) : null;

            return { asin, link, rank, rating, reviews };
          })
          .filter(Boolean);

        const nextPageLink = document.querySelector('.a-last a');

        return {
          productsOnPage: products,
          hasNextPage: !!nextPageLink,
        };
      });

      links.push(...productsOnPage);

      if (!hasNextPage) {
        break;
      }

      await Promise.all([
        page.click('.a-last a'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      ]);
    }

    links.forEach((link) => {
      console.log(
        `Crawled link: ${link?.link} (ASIN: ${link?.asin}, Rank: ${link?.rank}, Rating: ${link?.rating}, Reviews: ${link?.reviews})`,
      );
    });

    return links;
  }

  async crawlProduct(page: Page, asin: string): Promise<ICrawlerProduct> {
    // 🔷 Detect and handle interstitials
    const isCaptcha = await page.$('form[action*="validateCaptcha"]');
    if (isCaptcha) {
      throw new Error('Blocked: CAPTCHA detected.');
    }

    await imitateHuman(page);

    const product = await page.evaluate((asin: string) => {
      const getText = (sel: string) =>
        document.querySelector(sel)?.textContent?.trim() ?? '';

      const getNumber = (sel: string) => {
        const txt = getText(sel)?.replace(/,/g, '.');
        const num = parseFloat(txt.match(/[\d.]+/)?.[0] ?? '');
        return isNaN(num) ? 0 : num;
      };

      const getPrice = () => {
        const priceText =
          document
            .getElementById('corePriceDisplay_desktop_feature_div')
            ?.querySelector('.a-price-whole')?.textContent ??
          document.querySelector('.a-price .a-offscreen')?.textContent ??
          document.querySelector('.a-price-whole')?.textContent;
        const price = parseFloat(
          priceText?.replace(/[^0-9.]/g, '')?.replace(',', '.') ?? '',
        );
        return price || null;
      };

      const getImages = () => {
        const images = Array.from(
          document.getElementById('altImages')?.querySelectorAll('img') ?? [],
        )
          .map((img) => img.src)
          .filter(
            (src) => !src.includes('360_icon') && !src.includes('play-icon'),
          );

        return { imagesLinks: images, imageCount: images.length };
      };

      const getTotalVariations = () => {
        const totalVariations = Array.from(
          document.querySelectorAll('[data-totalvariationcount]'),
        ).map((el) =>
          parseInt(el.getAttribute('data-totalvariationcount') ?? '0'),
        );
        return {
          variations: totalVariations,
          totalVariations: totalVariations.reduce(
            (prev, curr) => prev * curr,
            1,
          ),
        };
      };

      const getSoldBy = () => {
        return (
          document
            .querySelector('#sellerProfileTriggerId')
            ?.textContent?.trim() || null
        );
      };

      const getDispatchesFrom = () => {
        return (
          document
            .getElementById('merchantInfoFeature_feature_div')
            ?.querySelector('.offer-display-feature-text-message')
            ?.textContent?.trim() ?? null
        );
      };

      const getDispatchesFromByFulfillerContainer = () => {
        return (
          document
            .getElementById('fulfillerInfoFeature_feature_div')
            ?.querySelector('.offer-display-feature-text-message')
            ?.textContent?.trim() ?? null
        );
      };

      const getBoughtForTheLastMonth = () => {
        return (
          document
            .getElementById('social-proofing-faceout-title-tk_bought')
            ?.querySelector('.a-text-bold')
            ?.textContent?.trim() ??
          document
            .getElementById('socialProofingAsinFaceout_feature_div')
            ?.querySelector('.a-text-bold')
            ?.textContent?.trim() ??
          null
        );
      };

      const getInteger = (sel: string) => {
        const txt = getText(sel);
        const cleaned = txt?.replace(/[^\d]/g, '');
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? 0 : num;
      };

      const getRRPPrice = (): number | null => {
        const parsePrice = (text?: string): number | null => {
          if (!text) return null;
          const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num;
        };

        // 1. Original logic (basisPrice class)
        const basisPriceElements = document.querySelectorAll(
          '.basisPrice .a-text-price .a-offscreen',
        );
        for (const el of basisPriceElements) {
          const price = parsePrice(el.textContent?.trim());
          if (price !== null) return price;
        }

        // 2. Fallback: Check #corePriceDisplay_desktop_feature_div
        const corePriceBlock = document.getElementById(
          'corePriceDisplay_desktop_feature_div',
        );
        if (corePriceBlock) {
          // Try to find a typical/strikethrough price
          const striked = corePriceBlock.querySelector(
            '.a-text-price .a-offscreen',
          );
          const price = parsePrice(striked?.textContent?.trim());
          if (price !== null) return price;
        }

        // 3. Fallback: Check for strikethrough prices elsewhere
        const globalStrike = document.querySelector(
          '.a-price.a-text-price .a-offscreen',
        );
        const price = parsePrice(globalStrike?.textContent?.trim());
        if (price !== null) return price;

        // No RRP found
        console.log('NO RRP FOUND');

        return null;
      };

      const getOtherMetrics = () => {
        const videoThumbnail = document.querySelector('.videoThumbnail');
        const videoCount = getNumber('#videoCount') || videoThumbnail ? 1 : 0;

        return {
          title: getText('#productTitle'),
          brand: getText('.po-brand .po-break-word'),
          reviewCount: getInteger('#acrCustomerReviewText'),
          stars: getNumber('#acrPopover span'),
          videoCount,
          amazonChoice: !!document.querySelector(
            '#acBadge_feature_div .a-size-small',
          ),
          withAPlusContent: !!document.getElementById('aplus'),
          customerSay:
            document
              .querySelector('#product-summary p span')
              ?.textContent?.trim() ?? '',
          link: document.URL,
        };
      };

      return {
        asin,
        price: getPrice() ?? 0,
        ...getImages(),
        ...getTotalVariations(),
        soldBy:
          getSoldBy() ||
          getDispatchesFrom() ||
          getDispatchesFromByFulfillerContainer() ||
          '',
        dispatchesFrom:
          getDispatchesFrom() || getDispatchesFromByFulfillerContainer() || '',
        boughtForTheLastMonth: getBoughtForTheLastMonth(),
        ...getOtherMetrics(),
        RRP: getRRPPrice() ?? 0,
      };
    }, asin);

    return product;
  }
}
