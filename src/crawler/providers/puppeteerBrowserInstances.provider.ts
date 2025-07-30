import { Provider } from '@nestjs/common';
import { CrawlerBrowserManagerService } from '../services/crawlerBrowserManager.service';
import { BrowsersReturn } from '../types/browsers-return.type';

export const PUPPETEER_BROWSER = Symbol('PUPPETEER_BROWSER');

export const PuppeteerBrowserProvider: Provider = {
  provide: PUPPETEER_BROWSER,
  inject: [CrawlerBrowserManagerService],
  useFactory: async (
    browserManager: CrawlerBrowserManagerService,
  ): Promise<BrowsersReturn[]> => {
    return await browserManager.initializeBrowsersWithAppropirateZipCode();
  },
};
