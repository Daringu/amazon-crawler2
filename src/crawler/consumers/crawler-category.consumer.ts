import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';
import { Job } from 'bullmq';
import { CrawlerCategoryService } from '../services/crawler-category.service';
import { UserAgentsService } from '../services/userAgents.service';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';
import { CrawlerRequestDto } from '../dtos/crawler-request.dto';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';
import { Browser, Page } from 'puppeteer';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { CrawlerProductService } from '../services/crawler-product.service';
import { ICrawledLink } from '../types/crawled-links.type';
import { CrawlerCategory } from '../entities/category.entity';
import { CategoryRepo } from '../repositories/category-repo.service';

@Processor(CRAWLER_QUEUES.CATEGORY_LINKS, {
  lockDuration: 2 * 60 * 60 * 1000,
  maxStalledCount: 2,
  concurrency: 2,
})
export class CrawlerCategoryConsumer extends WorkerHost {
  constructor(
    private readonly crawlerCategoryService: CrawlerCategoryService,
    private readonly userAgentsService: UserAgentsService,
    private readonly crawlerBrowserManager: CrawlerBrowserManagerService,
    private readonly crawlerProductService: CrawlerProductService,
    private readonly categoryRepo: CategoryRepo,
  ) {
    super();
  }

  async process(job: Job<CrawlerRequestDto>): Promise<any> {
    const { link, marketplace, categoryId } = job.data;

    try {
      const categoryFromRequest = categoryId
        ? await this.categoryRepo.getCategoryById(categoryId)
        : null;

      const finalLink = link ?? categoryFromRequest?.link;

      if (finalLink) {
        await this.crawl(marketplace, finalLink, categoryFromRequest);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async crawl(
    mp: AMAZON_MARKETPLACES,
    link: string,
    categoryFromRequest?: CrawlerCategory | null,
  ): Promise<CrawlerCategory> {
    if (!mp) throw new Error(`No browser found for marketplace`);
    console.log('crawling links');
    const br = (
      await this.crawlerBrowserManager.initializeBroserByMarketplace(mp, link)
    ).browser;

    const page = await br.newPage();
    let category: CrawlerCategory | null = null;
    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(this.userAgentsService.getRandomUserAgent());
      await page.goto(link, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const links = await this.crawlerCategoryService.crawlLinks(page);

      category =
        categoryFromRequest ??
        (await this.crawlerCategoryService.extractCategory(page, link, mp));

      if (!links) {
        throw new Error('no product links');
      }

      await this.crawlProducts(
        links.filter((link) => link !== null),
        br,
        mp,
        category,
      );

      return category;
    } catch (error) {
      console.error(`Error crawling category ${link}:`, error);
      throw error;
    } finally {
      if (category) {
        await this.crawlerCategoryService.finishCategoryCrawling(category.id);
      }
      await br.close();
      await page.close();
    }
  }

  private async crawlProducts(
    links: ICrawledLink[],
    br: Browser,
    mp: AMAZON_MARKETPLACES,
    category: CrawlerCategory,
  ) {
    const products: ICrawlerProduct[] = [];
    const batchSize = 1;

    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);

      const crawlPromises = batch.map(async (link) => {
        let page: Page | null = null;
        if (!link.link) {
          return null;
        }
        try {
          page = await br.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent(this.userAgentsService.getRandomUserAgent());
          await page.goto(link.link, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          const product = await this.crawlerProductService.crawlProduct(page);
          return product;
        } catch (err) {
          console.error(`Error crawling ${link.link}:`, err);
          return null;
        } finally {
          await page?.close();
        }
      });
      try {
        const results = await Promise.all(crawlPromises);
        products.push(...results.filter((product) => product !== null));
      } catch (error) {
        console.log(error);
      }
    }
    return await this.crawlerProductService.saveProducts(
      products,
      mp,
      category,
      links,
    );
  }
}
