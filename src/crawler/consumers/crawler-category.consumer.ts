import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';
import { Job } from 'bullmq';
import { CrawlerCategoryService } from '../services/crawler-category.service';
import { UserAgentsService } from '../services/userAgents.service';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';
import { CrawlerRequestDto } from '../dtos/crawler-request.dto';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';
import { AmazonMarketplaceService } from 'src/amazon-marketplace/amazon-marketplace.service';
import { Browser, Page } from 'puppeteer';
import { ICrawlerProduct } from '../types/crawler-product.type';
import { CrawlerProductService } from '../services/crawler-product.service';
import { cleanLink } from '../utils/cleanLinks';
import { CrawlerRequestRepo } from '../repositories/crawler-request.repository.service';
import { CrawlerRequest } from '../entities/crawl-request.entity';

@Processor(CRAWLER_QUEUES.CATEGORY_LINKS, {
  lockDuration: 2 * 60 * 60 * 1000,
  maxStalledCount: 2,
})
export class CrawlerCategoryConsumer extends WorkerHost {
  constructor(
    @InjectQueue(CRAWLER_QUEUES.CATEGORY_LINKS)
    private readonly amazonMarketplaceService: AmazonMarketplaceService,
    private readonly crawlerCategoryService: CrawlerCategoryService,
    private readonly userAgentsService: UserAgentsService,
    private readonly crawlerBrowserManager: CrawlerBrowserManagerService,
    private readonly crawlerProductService: CrawlerProductService,
    private readonly crawlerRequestRepo: CrawlerRequestRepo,
  ) {
    super();
  }

  async process(job: Job<CrawlerRequestDto>): Promise<any> {
    const { marketplace, profileId, link: dirtyLink } = job.data;
    try {
      const link = cleanLink(
        dirtyLink,
        this.amazonMarketplaceService.getMarketplaceLanguage(marketplace),
      );
      const matchMarketplace =
        this.amazonMarketplaceService.isLinkFromMarketplace(marketplace, link);

      if (!matchMarketplace) {
        throw new Error('link does not match marketplace');
      }
      let crawlerRequest: CrawlerRequest = new CrawlerRequest();
      crawlerRequest.link = link;
      crawlerRequest.profileId = profileId;
      const existingRequest = await this.crawlerRequestRepo.findOneBy({
        link,
        profileId,
      });

      if (existingRequest) {
        crawlerRequest = existingRequest;
      }

      const res = await this.crawl(marketplace, link);

      crawlerRequest.products = res
        .filter((pr) => pr.status === 'fulfilled')
        .map((pr) => pr.value);

      await this.crawlerRequestRepo.save(crawlerRequest);
    } catch (error) {
      console.log(error);
    }
  }

  private crawl = async (mp: AMAZON_MARKETPLACES, link: string) => {
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

    const products = await this.crawlProducts(links, br);

    await br.close();

    return products;
  };

  private async crawlProducts(links: string[], br: Browser) {
    const products: ICrawlerProduct[] = [];
    const batchSize = 5;

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
    return await this.crawlerProductService.saveProducts(products);
  }
}
