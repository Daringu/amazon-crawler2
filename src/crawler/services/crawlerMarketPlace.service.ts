import { Injectable } from '@nestjs/common';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';

@Injectable()
export class CrawlerMarketPlaceService {
  extractMarketplaceFromUrl(url: string): CRAWLER_MARKETPLACES | null {
    const match = url.match(/https?:\/\/www\.amazon\.([a-z.]+)\//i);
    const marketplace = match?.[1];
    if (
      marketplace &&
      Object.values(CRAWLER_MARKETPLACES).includes(
        marketplace as CRAWLER_MARKETPLACES,
      )
    ) {
      return marketplace as CRAWLER_MARKETPLACES;
    }
    return null;
  }
}
