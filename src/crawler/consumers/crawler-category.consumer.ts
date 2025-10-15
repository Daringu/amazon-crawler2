import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';
import { Job, Queue } from 'bullmq';
import { CrawlerCategoryService } from '../services/crawler-category.service';
import { UserAgentsService } from '../services/userAgents.service';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';
import { CrawlerRequestDto } from '../dtos/crawler-request.dto';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';
import { Browser, Page } from 'puppeteer';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { CrawlerProductService } from '../services/crawler-product.service';
import { CrawlerRequestRepo } from '../repositories/crawler-request.repository.service';
import { CrawlerRequest } from '../entities/crawl-request.entity';

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
    private readonly crawlerRequestRepo: CrawlerRequestRepo,
    @InjectQueue(CRAWLER_QUEUES.FINISHED_CRALWING)
    private readonly finishedCrawlingQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<CrawlerRequestDto>): Promise<any> {
    const { requestId, marketplace } = job.data;
    const crawlerRequest: CrawlerRequest | null =
      await this.crawlerRequestRepo.findOneBy({
        id: requestId,
      });
    try {
      if (!crawlerRequest) {
        throw new Error('request not found');
      }
      crawlerRequest.isLoading = true;

      const res = await this.crawl(marketplace, crawlerRequest.link);

      crawlerRequest.products = res
        .filter((pr) => pr.status === 'fulfilled')
        .map((pr) => pr.value);

      await this.crawlerRequestRepo.save(crawlerRequest);
    } catch (error) {
      if (crawlerRequest) {
        crawlerRequest.isError = true;
      }
      console.error(error);
    } finally {
      if (crawlerRequest) {
        crawlerRequest.isLoading = false;
        await this.crawlerRequestRepo.save(crawlerRequest);
        await this.finishedCrawlingQueue.add(`finished-crawling-${requestId}`, {
          profileId: crawlerRequest.profileId,
          requestId: crawlerRequest.id,
        });
      }
    }
  }

  private async crawl(mp: AMAZON_MARKETPLACES, link: string) {
    if (!mp) throw new Error(`No browser found for marketplace`);

    const br = (
      await this.crawlerBrowserManager.initializeBroserByMarketplace(mp, link)
    ).browser;

    const page = await br.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(this.userAgentsService.getRandomUserAgent());
    await page.goto(link, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const links = await this.crawlerCategoryService.crawlLinks(page);

    if (!links) {
      await br.close();
      await page.close();
      throw new Error('no product links');
    }

    const products = await this.crawlProducts(links, br, mp);

    await br.close();

    return products;
  }

  private async crawlProducts(
    links: string[],
    br: Browser,
    mp: AMAZON_MARKETPLACES,
  ) {
    const products: ICrawlerProduct[] = [];
    const batchSize = 1;

    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);

      const crawlPromises = batch.map(async (link) => {
        let page: Page | null = null;
        try {
          page = await br.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent(this.userAgentsService.getRandomUserAgent());
          await page.goto(link, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          const product = await this.crawlerProductService.crawlProduct(page);
          return product;
        } catch (err) {
          console.error(`Error crawling ${link}:`, err);
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
    return await this.crawlerProductService.saveProducts(products, mp);
  }
}
