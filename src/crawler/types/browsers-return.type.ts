import { Browser } from 'puppeteer';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';

export interface BrowsersReturn {
  browser: Browser;
  marketplace: CRAWLER_MARKETPLACES;
}
