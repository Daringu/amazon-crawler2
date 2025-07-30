import { Injectable } from '@nestjs/common';
import { ProductLinkRepo } from '../repositories/product-link-repo.service';
import { CategoryLinkRepo } from '../repositories/category-link-repo.service';
import { CrawlerLink } from '../entities/abstract-link.entity';
import { CrawlerMarketPlaceService } from './crawlerMarketPlace.service';
import { ProductLink } from '../entities/product-link.entity';
import { In } from 'typeorm';
import { CategoryLink } from '../entities/category-link.entity';
import { CRAWLER_LINK_STATE } from '../types/link-state.type';

@Injectable()
export class CrawlerLinksService {
  constructor(
    private readonly productLinkRepo: ProductLinkRepo,
    private readonly categoryLinkRepo: CategoryLinkRepo,
    private readonly crawlerMarketplaceService: CrawlerMarketPlaceService,
  ) {}

  private readonly linksToAvoid = [
    'mobile-apps',
    'books',
    'amazon-devices',
    'digital-text',
    'instant-video',
    'dmusic',
    'dvd-de',
  ];

  linkShouldBeAvoided(link: string): boolean {
    const normalizedLink = link.toLowerCase();
    return this.linksToAvoid.some((wordToAvoid) =>
      normalizedLink.includes(wordToAvoid),
    );
  }

  async updateProductLinksState(
    links: ProductLink[],
    linksState: CRAWLER_LINK_STATE,
  ) {
    return await this.productLinkRepo.update(
      links.map((link) => link.id),
      { linkState: linksState },
    );
  }

  async updateCategoryLinksState(
    links: CategoryLink[],
    linksState: CRAWLER_LINK_STATE,
  ) {
    return await this.categoryLinkRepo.update(
      links.map((link) => link.id),
      { linkState: linksState },
    );
  }

  async saveProductLinks(links: Partial<CrawlerLink>[]) {
    // Extract only the URLs from links
    const linkUrls = links.map((link) => link.link);

    // Find existing links in DB
    const existingLinks = await this.productLinkRepo.find({
      where: { link: In(linkUrls) },
      select: ['link'],
    });
    const existingLinksSet = new Set(existingLinks.map((l) => l.link));
    // Filter links to save only new ones
    const newLinks = links.filter((link) => !existingLinksSet.has(link.link!));

    // Map new links to entities
    const linksToSave = newLinks
      .map((link) => {
        const mp = this.crawlerMarketplaceService.extractMarketplaceFromUrl(
          link.link!,
        );
        if (!mp) return null;
        const entity = new ProductLink();
        entity.link = link.link!;
        entity.linkState = link.linkState!;
        entity.marketplace = mp;
        return entity;
      })
      .filter(Boolean);

    if (linksToSave.length === 0) {
      return; // nothing to save
    }

    // Insert new links only
    await this.productLinkRepo.save(
      linksToSave.filter((link) => link !== null),
    );
  }

  async saveCategoryLinks(links: Partial<CrawlerLink>[]) {
    // Extract only the URLs from links
    const linkUrls = links.map((link) => link.link);

    // Find existing links in DB
    const existingLinks = await this.categoryLinkRepo.find({
      where: { link: In(linkUrls) },
      select: ['link'],
    });
    const existingLinksSet = new Set(existingLinks.map((l) => l.link));

    // Filter links to save only new ones
    const newLinks = links.filter((link) => !existingLinksSet.has(link.link!));

    // Map new links to entities
    const linksToSave = newLinks
      .map((link) => {
        const mp = this.crawlerMarketplaceService.extractMarketplaceFromUrl(
          link.link!,
        );
        if (!mp) return null;
        const entity = new CategoryLink();
        entity.link = link.link!;
        entity.linkState = link.linkState!;
        entity.marketplace = mp;
        return entity;
      })
      .filter(Boolean);

    if (linksToSave.length === 0) {
      return; // nothing to save
    }

    // Insert new links only
    await this.categoryLinkRepo.save(
      linksToSave.filter((link) => link !== null),
    );
  }
}
