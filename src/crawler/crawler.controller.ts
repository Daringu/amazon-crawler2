import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { CRAWLER_QUEUES } from './consts/crawler-queues';
import { Queue } from 'bullmq';
import { CategoryLinkRepo } from './repositories/category-link-repo.service';
import { initialCrawlLinksByMarketplace } from './consts/initial-crawl-links-by-marketplace';
import { CategoryLink } from './entities/category-link.entity';
import { CRAWLER_MARKETPLACES } from './consts/marketplaces';

@Controller('crawler')
export class CrawlerController {
  constructor(
    @InjectQueue(CRAWLER_QUEUES.CATEGORY_LINKS)
    private readonly categoryQueue: Queue,
    @InjectQueue(CRAWLER_QUEUES.PRODUCT_ENTITIES)
    private readonly productQueue: Queue,
    private readonly categoryLinkRepo: CategoryLinkRepo,
  ) {}

  @Get('start')
  async start() {
    const categoryCount = await this.categoryLinkRepo.count();

    if (!categoryCount) {
      await this.categoryLinkRepo.save(
        Object.entries(initialCrawlLinksByMarketplace).map((link) => {
          const [mp, l] = link;
          const entity = new CategoryLink();
          entity.link = l;
          entity.marketplace = mp as CRAWLER_MARKETPLACES;

          return entity;
        }),
      );
    }

    await this.categoryQueue.add('links-crawl', {});
    await this.productQueue.add('product-crawl', {});
  }
}
