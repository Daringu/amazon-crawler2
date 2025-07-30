import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';
import { Queue } from 'bullmq';
import { CrawlerLinksService } from '../services/crawler-links.service';
import { CrawlerCategoryService } from '../services/crawler-category.service';
import { CRAWLER_LINK_STATE } from '../types/link-state.type';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';
import { UserAgentsService } from '../services/userAgents.service';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';

@Processor(CRAWLER_QUEUES.CATEGORY_LINKS, {
  lockDuration: 2 * 60 * 60 * 1000,
  maxStalledCount: 2,
})
export class CrawlerCategoryConsumer extends WorkerHost {
  constructor(
    @InjectQueue(CRAWLER_QUEUES.CATEGORY_LINKS)
    private readonly categoriesQueue: Queue,
    private readonly crawlerLinkService: CrawlerLinksService,
    private readonly crawlerCategoryService: CrawlerCategoryService,
    private readonly userAgentsService: UserAgentsService,
    private readonly crawlerBrowserManager: CrawlerBrowserManagerService,
  ) {
    super();
  }

  async process(): Promise<any> {
    try {
      const links = await this.crawlerCategoryService.getNewlyDiscoveredLinks();

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

      await this.crawlerLinkService.updateCategoryLinksState(
        links,
        CRAWLER_LINK_STATE.VISITED,
      );
    } catch (error) {
      console.log(error);
    } finally {
      await this.categoriesQueue.add('links-crawl', {});
    }
  }

  private crawl = async (mp: CRAWLER_MARKETPLACES, links: string[]) => {
    if (!mp) throw new Error(`No browser found for marketplace`);

    const batchSize = 1;
    const br = (
      await this.crawlerBrowserManager.initializeBroserByMarketplace(mp)
    ).browser;
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);

      const crawlPromises = batch.map(async (link) => {
        const page = await br.newPage();
        try {
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent(this.userAgentsService.getRandomUserAgent());
          await page.goto(link, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          await this.crawlerCategoryService.crawlLinks(page);
        } catch (err) {
          console.error(`Error crawling ${link}:`, err);
        } finally {
          await page.close();
        }
      });

      await Promise.all(crawlPromises);
    }
    await br.close();
  };
}
