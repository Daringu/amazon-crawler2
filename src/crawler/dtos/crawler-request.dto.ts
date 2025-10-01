import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

export class CrawlerRequestDto {
  requestId: number;
  marketplace: AMAZON_MARKETPLACES;
}
