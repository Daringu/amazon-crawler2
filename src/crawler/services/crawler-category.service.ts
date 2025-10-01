import { Injectable } from '@nestjs/common';
import { CategoryRepo } from '../repositories/category-repo.service';
import { CrawlerCategory } from '../entities/category.entity';
import { In } from 'typeorm';
import { Page } from 'puppeteer';
import { CrawlerProductService } from './crawler-product.service';
import { imitateHuman } from '../utils/immitate-human';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

@Injectable()
export class CrawlerCategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepo,
    private readonly crawlerProduct: CrawlerProductService,
  ) {}

  async crawlLinks(page: Page) {
    await imitateHuman(page);
    try {
      const links = await this.crawlerProduct.crawlProductLinks(page);

      return links;
    } catch (error) {
      console.log(error);
    }
  }

  async saveCategories(
    categories: { link: string; marketplace: AMAZON_MARKETPLACES }[],
  ) {
    const enitites = categories.map((category) => {
      const entity = new CrawlerCategory();
      entity.name = category.link;
      entity.marketplace = category.marketplace;
      return entity;
    });

    await this.categoryRepo.upsert(enitites, {
      conflictPaths: ['name', 'marketplace'],
      skipUpdateIfNoValuesChanged: true,
    });

    return await this.categoryRepo.find({
      where: {
        name: In(categories.map((c) => c.link)),
        marketplace: In(categories.map((c) => c.marketplace)),
      },
    });
  }
}
