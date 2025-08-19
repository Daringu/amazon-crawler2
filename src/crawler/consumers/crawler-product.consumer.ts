import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';
import { Job, Queue } from 'bullmq';
import { CrawlerLinksService } from '../services/crawler-links.service';
import { CRAWLER_LINK_STATE } from '../types/link-state.type';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';
import { UserAgentsService } from '../services/userAgents.service';
import { CrawlerProductService } from '../services/crawler-product.service';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';
import { Page } from 'puppeteer';
import { JobData } from '../types/job-data';

@Processor(CRAWLER_QUEUES.PRODUCT_ENTITIES, {
  lockDuration: 2 * 60 * 60 * 1000,
  maxStalledCount: 2,
})
export class CrawlerProductConsumer extends WorkerHost {
  constructor(
    @InjectQueue(CRAWLER_QUEUES.PRODUCT_ENTITIES)
    private readonly productQueue: Queue,
    private readonly crawlerLinkService: CrawlerLinksService,
    private readonly crawlerProductService: CrawlerProductService,
    private readonly userAgentsService: UserAgentsService,
    private readonly crawlerBrowserManager: CrawlerBrowserManagerService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<any> {
    const predeterminedIds = job.data?.linkIds ?? [];
    try {
      const links =
        predeterminedIds.length > 0
          ? await this.crawlerProductService.getLinksByIds(predeterminedIds)
          : await this.crawlerProductService.getNewlyDiscoveredLinks();

      if (links.length < 1) {
        return { ok: true };
      }

      const linksByMarketplace: Record<CRAWLER_MARKETPLACES, string[]> = {
        [CRAWLER_MARKETPLACES.GERMAN]: [],
        [CRAWLER_MARKETPLACES.USA]: [],
      };

      links.forEach((link) => {
        linksByMarketplace[link.marketplace].push(link.link);
      });

      await Promise.all(
        Object.entries(linksByMarketplace).map(([mp, links]) =>
          this.crawl(mp as CRAWLER_MARKETPLACES, links),
        ),
      );

      await this.crawlerLinkService.updateProductLinksState(
        links,
        CRAWLER_LINK_STATE.VISITED,
      );
    } catch (error) {
      console.log(error);
    } finally {
      if (job.name !== 'predetirmined-products') {
        await this.productQueue.add('product-crawl', {});
      }
    }
  }

  private crawl = async (mp: CRAWLER_MARKETPLACES, links: string[]) => {
    if (!mp) throw new Error(`No browser found for marketplace`);

    const products: ICrawlerProduct[] = [];
    const batchSize = 5;
    const br = (
      await this.crawlerBrowserManager.initializeBroserByMarketplace(mp)
    ).browser;

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
    await br.close();
    await this.crawlerProductService.saveProducts(products);
  };
}
