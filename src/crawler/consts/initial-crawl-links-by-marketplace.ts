import { CRAWLER_MARKETPLACES } from "./marketplaces";

export const initialCrawlLinksByMarketplace: Record<
  CRAWLER_MARKETPLACES,
  string
> = {
  [CRAWLER_MARKETPLACES.GERMAN]: "https://www.amazon.de/-/en/gp/bestsellers/",
  [CRAWLER_MARKETPLACES.USA]: "https://www.amazon.com/-/en/gp/bestsellers/",
};
