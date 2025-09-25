import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

export class CrawlerRequestDto {
  profileId: number;
  link: string;
  marketplace: AMAZON_MARKETPLACES;
}
