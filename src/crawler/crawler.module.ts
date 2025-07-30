import { Module } from '@nestjs/common';
import { CrawlerMarketPlaceService } from './services/crawlerMarketPlace.service';
import { CrawlerBrowserManagerService } from './services/crawlerBrowserManager.service';
import { UserAgentsService } from './services/userAgents.service';
// import { PuppeteerBrowserProvider } from "./providers/puppeteerBrowserInstances.provider";
import { CategoryLink } from './entities/category-link.entity';
import { ProductLinkRepo } from './repositories/product-link-repo.service';
import { CategoryLinkRepo } from './repositories/category-link-repo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductLink } from './entities/product-link.entity';
import { ProductRepo } from './repositories/product-repo.service';
import { CategoryRepo } from './repositories/category-repo.service';
import { CrawlerCategory } from './entities/category.entity';
import { CrawlerProductEntity } from './entities/product.entity';
import { CrawlerCategoryService } from './services/crawler-category.service';
import { CrawlerProductService } from './services/crawler-product.service';
import { CrawlerLinksService } from './services/crawler-links.service';
import { BullModule } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from './consts/crawler-queues';
import { CrawlerProductConsumer } from './consumers/crawler-product.consumer';
import { CrawlerCategoryConsumer } from './consumers/crawler-category.consumer';
import { CrawlerController } from './crawler.controller';
// import { PuppeteerBrowserProvider } from './providers/puppeteerBrowserInstances.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryLink,
      ProductLink,
      CrawlerCategory,
      CrawlerProductEntity,
    ]),
    BullModule.registerQueue(
      { name: CRAWLER_QUEUES.CATEGORY_LINKS },
      { name: CRAWLER_QUEUES.PRODUCT_ENTITIES },
    ),
  ],
  providers: [
    CrawlerMarketPlaceService,
    CrawlerBrowserManagerService,
    UserAgentsService,
    // PuppeteerBrowserProvider,
    CategoryLinkRepo,
    ProductLinkRepo,
    ProductRepo,
    CategoryRepo,
    CrawlerCategoryService,
    CrawlerProductService,
    CrawlerLinksService,
    CrawlerProductConsumer,
    CrawlerCategoryConsumer,
  ],
  controllers: [CrawlerController],
})
export class CrawlerModule {}
