import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

export class CrawlerRequestDto {
  link?: string | null;
  categoryId?: number | null;
  marketplace: AMAZON_MARKETPLACES;
  profileId: number;
}
