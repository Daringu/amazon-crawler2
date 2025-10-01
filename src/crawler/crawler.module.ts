import { Module } from '@nestjs/common';
import { CrawlerBrowserManagerService } from './services/crawlerBrowserManager.service';
import { UserAgentsService } from './services/userAgents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRepo } from './repositories/product-repo.service';
import { CategoryRepo } from './repositories/category-repo.service';
import { CrawlerCategory } from './entities/category.entity';
import { CrawlerProductEntity } from './entities/product.entity';
import { CrawlerCategoryService } from './services/crawler-category.service';
import { CrawlerProductService } from './services/crawler-product.service';
import { BullModule } from '@nestjs/bullmq';
import { CRAWLER_QUEUES } from './consts/crawler-queues';
import { CrawlerCategoryConsumer } from './consumers/crawler-category.consumer';
import { AmazonMarketplaceModule } from 'src/amazon-marketplace/amazon-marketplace.module';
import { CrawlerRequest } from './entities/crawl-request.entity';
import { CrawlerRequestRepo } from './repositories/crawler-request.repository.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrawlerCategory,
      CrawlerProductEntity,
      CrawlerRequest,
    ]),
    BullModule.registerQueue(
      { name: CRAWLER_QUEUES.CATEGORY_LINKS },
      { name: CRAWLER_QUEUES.FINISHED_CRALWING },
    ),
    AmazonMarketplaceModule,
  ],
  providers: [
    CrawlerBrowserManagerService,
    UserAgentsService,
    ProductRepo,
    CategoryRepo,
    CrawlerCategoryService,
    CrawlerProductService,
    CrawlerCategoryConsumer,
    CrawlerRequestRepo,
  ],
})
export class CrawlerModule {}
