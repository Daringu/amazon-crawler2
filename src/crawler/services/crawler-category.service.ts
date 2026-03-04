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

  async finishCategoryCrawling(categoryId: number) {
    await this.categoryRepo.update({ id: categoryId }, { loading: false });
  }

  async extractCategory(
    page: Page,
    link: string,
    marketplace: AMAZON_MARKETPLACES,
  ): Promise<CrawlerCategory> {
    const category = await page.evaluate(() => {
      const text = document
        .querySelector('h1.a-size-large.a-text-bold')
        ?.textContent?.trim();

      if (!text) return null;

      return text.replace(/^Best Sellers in\s*/i, '');
    });

    console.log('extracted category', category);

    if (!category) {
      throw new Error('Category not found on the page');
    }

    const categoryEntity = new CrawlerCategory();
    categoryEntity.name = category;
    categoryEntity.link = link;
    categoryEntity.marketplace = marketplace;
    categoryEntity.loading = true;

    await this.categoryRepo.upsert(categoryEntity, {
      conflictPaths: ['name', 'marketplace'],
      skipUpdateIfNoValuesChanged: true,
    });

    const result = await this.categoryRepo.findOneBy({
      name: category,
      marketplace,
    });

    if (!result) {
      throw new Error('Failed to save or retrieve the category');
    }

    return result;
  }

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
    });

    return await this.categoryRepo.find({
      where: {
        name: In(categories.map((c) => c.link)),
        marketplace: In(categories.map((c) => c.marketplace)),
      },
    });
  }
}
