import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CrawlerCategoryService } from './crawler-category.service';
import { ProductRepo } from '../repositories/product-repo.service';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { In } from 'typeorm';
import { CrawlerProductEntity } from '../entities/product.entity';
import { Page } from 'puppeteer';
import { SellersRank } from '../types/sellers-rank.type';
import { imitateHuman } from '../utils/immitate-human';
import { extractAmazonAmount } from '../utils/extractAmazonAmount';
import { AmazonMarketplaceService } from 'src/amazon-marketplace/amazon-marketplace.service';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

@Injectable()
export class CrawlerProductService {
  constructor(
    @Inject(forwardRef(() => CrawlerCategoryService))
    private readonly crawlerCategory: CrawlerCategoryService,
    private readonly productRepo: ProductRepo,
    private readonly marketplaceService: AmazonMarketplaceService,
  ) {}

  async saveProducts(
    products: ICrawlerProduct[],
    marketplace: AMAZON_MARKETPLACES,
  ) {
    const asins = products.map((product) => product.asin);

    const existingProducts = await this.productRepo.find({
      where: { asin: In(asins) },
    });

    const result = await Promise.allSettled(
      products.map(async (product) => {
        const mp = marketplace;
        const categories = await this.crawlerCategory.saveCategories(
          product.sellerRanks.map((c) => ({
            link: c.category,
            marketplace: mp,
          })),
        );

        const entity =
          existingProducts.find(
            (ex) => ex.asin === product.asin && ex.marketplace === mp,
          ) ?? new CrawlerProductEntity();

        // Always set these two keys
        entity.asin = product.asin;
        entity.marketplace = mp;

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
        entity.sellerRanks = product.sellerRanks ?? [];
        entity.categories = categories;
        entity.RRP = product.RRP;

        return await this.productRepo.save(entity);
      }),
    );

    const failed = result.filter((pr) => pr.status === 'rejected');
    console.log('failed', failed);

    return result;
  }

  async crawlProductLinks(page: Page) {
    const links: string[] = [];
    while (true) {
      const startTime = Date.now();
      while (Date.now() - startTime < 3000) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise((res) => setTimeout(res, 200));
      }

      const { productsOnPage, hasNextPage } = await page.evaluate(() => {
        const products = Array.from(
          Array.from(document.querySelectorAll('[data-card-metrics-id]') ?? [])
            .filter((el) => el.querySelector('[data-asin]'))?.[0]
            ?.querySelectorAll('[data-asin]') ?? [],
        )
          .map((el) => el.querySelector('a')?.href)
          .filter(Boolean);
        const nextPageLink = document.querySelector('.a-last a');
        return {
          productsOnPage: products.filter((product) => product !== undefined),
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

    return links;
  }

  async crawlProduct(page: Page): Promise<ICrawlerProduct> {
    // 🔷 Detect and handle interstitials
    const isCaptcha = await page.$('form[action*="validateCaptcha"]');
    if (isCaptcha) {
      throw new Error('Blocked: CAPTCHA detected.');
    }

    await imitateHuman(page);

    const product = await page.evaluate(() => {
      const getText = (sel: string) =>
        document.querySelector(sel)?.textContent?.trim() ?? '';

      const getNumber = (sel: string) => {
        const txt = getText(sel)?.replace(/,/g, '.');
        const num = parseFloat(txt.match(/[\d.]+/)?.[0] ?? '');
        return isNaN(num) ? 0 : num;
      };

      const extractASINFromURL = (url: string) => {
        const match =
          url.match(/\/dp\/([A-Z0-9]{10})/) ||
          url.match(/\/gp\/product\/([A-Z0-9]{10})/);
        return match ? match[1] : null;
      };

      const getASIN = () => {
        const detailBullets = document.querySelector(
          '#detailBullets_feature_div',
        );
        if (detailBullets) {
          const listItems = detailBullets.querySelectorAll('li');
          for (const li of listItems) {
            const labelSpan = li.querySelector('.a-text-bold');
            if (!labelSpan) continue;

            const label = labelSpan.textContent
              ?.replace(/\s/g, '')
              ?.replace(/[:\u200e\u200f]/g, '')
              ?.toLowerCase();

            if (label === 'asin') {
              const parentSpan = labelSpan.parentElement;
              if (!parentSpan) continue;

              const asinSpan = Array.from(parentSpan.children).find(
                (el) =>
                  !el.classList.contains('a-text-bold') &&
                  el.tagName === 'SPAN',
              );
              if (asinSpan) {
                return asinSpan.textContent?.trim();
              }
            }
          }
        }

        const productDetails = document.querySelector(
          '#productDetails_detailBullets_sections1',
        );
        if (productDetails) {
          const rows = Array.from(productDetails.querySelectorAll('tr'));
          for (const row of rows) {
            const th = row.querySelector('th');
            if (th && th.textContent?.toLowerCase().includes('asin')) {
              return row.querySelector('td')?.textContent?.trim() || null;
            }
          }
        }

        const rows = Array.from(document.querySelectorAll('tr'));
        for (const row of rows) {
          const th = row.querySelector('th');
          if (th && th.textContent?.toLowerCase().includes('asin')) {
            return row.querySelector('td')?.textContent?.trim() || null;
          }
        }

        const bullets = document.querySelector('#detailBullets_feature_div');
        if (bullets) {
          const items = Array.from(bullets.querySelectorAll('li'));
          for (const li of items) {
            if (li.innerText.includes('ASIN')) {
              const match = li.innerText.match(/ASIN\s*[:\s]*([A-Z0-9]+)/i);
              if (match) {
                return match[1];
              }
            }
          }
        }

        const match = document.body.innerText.match(
          /ASIN\s*[:\s]*([A-Z0-9]{10})/i,
        );
        if (match) {
          return match[1];
        }

        return extractASINFromURL(document.URL);
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
            .getElementById('merchantInfoFeature_feature_div')
            ?.querySelector('.offer-display-feature-text-message')
            ?.textContent?.trim() ?? null
        );
      };

      const getDispatchesFrom = () => {
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

      const getSellerRanks = () => {
        const ranks: SellersRank[] = [];
        const table = document.querySelector(
          '#productDetails_detailBullets_sections1',
        );
        if (table) {
          const rows = Array.from(table.querySelectorAll('tr'));
          for (const row of rows) {
            const th = row.querySelector('th');
            if (
              th &&
              th.textContent?.trim().toLowerCase().includes('best sellers rank')
            ) {
              const td = row.querySelector('td');
              if (td) {
                const lines = td.innerText.split('\n').map((s) => s.trim());
                for (const line of lines) {
                  const match = line.match(
                    /#?([\d,]+)\s+in\s+(.+?)(?:\s+\(.*?\))?$/i,
                  );
                  if (match) {
                    ranks.push({
                      rank: parseInt(match[1]?.replace(/,/g, ''), 10),
                      category: match[2],
                    });
                  }
                }
                if (ranks.length === 0) {
                  const listItems = td.querySelectorAll('ul li');
                  for (const li of listItems) {
                    const text = li.textContent?.trim();
                    const match = text?.match(
                      /#?([\d,]+)\s+in\s+(.+?)(?:\s+\(.*?\))?$/i,
                    );
                    if (match) {
                      ranks.push({
                        rank: parseInt(match[1]?.replace(/,/g, ''), 10),
                        category: match[2],
                      });
                    }
                  }
                }
              }
            }
          }
        }

        if (ranks.length === 0) {
          const bullets = document.querySelector(
            '#detailBulletsWrapper_feature_div',
          );
          if (bullets) {
            const lis = bullets.querySelectorAll('li');
            for (const li of lis) {
              if (li.innerText.toLowerCase().includes('best sellers rank')) {
                const lines = li.innerText.split('\n').map((s) => s.trim());
                for (const line of lines) {
                  const match = line.match(
                    /#?([\d,]+)\s+in\s+(.+?)(?:\s+\(.*?\))?$/i,
                  );
                  if (match) {
                    ranks.push({
                      rank: parseInt(match[1]?.replace(/,/g, ''), 10),
                      category: match[2],
                    });
                  }
                }
              }
            }
          }
        }

        // 3. Fallback: zeitgeistBadge_feature_div
        if (ranks.length === 0) {
          const badgeDiv = document.querySelector(
            '#zeitgeistBadge_feature_div',
          );
          if (badgeDiv) {
            const rankSpan = badgeDiv.querySelector('.mvt-best-seller-badge');
            const categorySpan = badgeDiv.querySelector(
              '.mvt-cat-name .cat-link',
            );

            if (rankSpan && categorySpan) {
              const rankMatch = rankSpan.textContent?.match(/#?([\d,]+)/);
              const rawCategory = categorySpan.textContent?.trim() || '';

              // remove leading 'in ' if present
              const category = rawCategory.replace(/^in\s+/i, '');

              if (rankMatch && category) {
                ranks.push({
                  rank: parseInt(rankMatch[1].replace(/,/g, ''), 10),
                  category,
                });
              }
            }
          }
        }

        return ranks;
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
        asin: getASIN()!,
        price: getPrice() ?? 0,
        ...getImages(),
        ...getTotalVariations(),
        soldBy: getSoldBy() ?? '',
        dispatchesFrom: getDispatchesFrom() ?? '',
        boughtForTheLastMonth: getBoughtForTheLastMonth(),
        sellerRanks: getSellerRanks(),
        ...getOtherMetrics(),
        RRP: getRRPPrice() ?? 0,
      };
    });

    return product;
  }
}
