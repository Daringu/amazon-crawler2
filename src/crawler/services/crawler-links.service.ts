import { Injectable } from '@nestjs/common';
import { AmazonMarketplaceService } from 'src/amazon-marketplace/amazon-marketplace.service';

@Injectable()
export class CrawlerLinksService {
  constructor(
    private readonly crawlerMarketplaceService: AmazonMarketplaceService,
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
}
