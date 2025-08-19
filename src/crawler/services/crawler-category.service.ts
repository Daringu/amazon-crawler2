import { Injectable } from '@nestjs/common';
import { CategoryLinkRepo } from '../repositories/category-link-repo.service';
import { CRAWLER_LINK_STATE } from '../types/link-state.type';
import { CategoryRepo } from '../repositories/category-repo.service';
import { CrawlerCategory } from '../entities/category.entity';
import { In } from 'typeorm';
import { Page } from 'puppeteer';
import { CrawlerLinksService } from './crawler-links.service';
import { cleanLink } from '../utils/cleanLinks';
import { CrawlerProductService } from './crawler-product.service';
import { imitateHuman } from '../utils/immitate-human';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CRAWLER_QUEUES } from '../consts/crawler-queues';

@Injectable()
export class CrawlerCategoryService {
  constructor(
    private readonly categoryLinkRepo: CategoryLinkRepo,
    private readonly categoryRepo: CategoryRepo,
    private readonly crawlerLinks: CrawlerLinksService,
    private readonly crawlerProduct: CrawlerProductService,
    @InjectQueue(CRAWLER_QUEUES.PRODUCT_ENTITIES)
    private readonly productQueue: Queue,
  ) {}

  async getNewlyDiscoveredLinks() {
    return await this.categoryLinkRepo.find({
      where: { linkState: CRAWLER_LINK_STATE.NEWLY_DISCOVERED },
      take: 20,
    });
  }

  async getLinksByIds(ids: number[]) {
    return await this.categoryLinkRepo.find({ where: { id: In(ids) } });
  }

  async crawlLinks(page: Page) {
    await imitateHuman(page);
    const links = await page.evaluate(() => {
      const container =
        document.querySelector(
          '[data-card-metrics-id="p13n-zg-nav-tree-all_zeitgeist-lists_1"] ul',
        ) ||
        document.querySelector(
          '._p13n-zg-nav-tree-all_style_zg-browse-group__88fbz',
        ) ||
        document.querySelector('ul');

      if (!container) return [];

      const links = Array.from(container.querySelectorAll('a'))
        .map((a) => a.href)
        .filter((href) => href && href.includes('/'));
      return links;
    });

    const cleanLinks = links
      .map(cleanLink)
      .filter((link) => !this.crawlerLinks.linkShouldBeAvoided(link));
    try {
      const links = await this.crawlerProduct.crawlProductLinks(page);

      if (links) {
        await this.productQueue.add('predetirmined-products', {
          linkIds: links.map((link) => link.id),
        });
      }
    } catch (error) {
      console.log(error);
    }

    return await this.crawlerLinks.saveCategoryLinks(
      cleanLinks.map((link) => ({
        link,
        linkState: CRAWLER_LINK_STATE.NEWLY_DISCOVERED,
      })),
    );
  }

  async saveCategories(categories: string[]) {
    const enitites = categories.map((category) => {
      const entity = new CrawlerCategory();
      entity.name = category;
      return entity;
    });

    await this.categoryRepo.upsert(enitites, {
      conflictPaths: ['name'],
      skipUpdateIfNoValuesChanged: true,
    });

    return await this.categoryRepo.find({ where: { name: In(categories) } });
  }
}
