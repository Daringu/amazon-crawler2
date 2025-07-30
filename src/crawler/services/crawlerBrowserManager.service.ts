import * as puppeteer from 'puppeteer';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';
import { UserAgentsService } from './userAgents.service';
import { initialCrawlLinksByMarketplace } from '../consts/initial-crawl-links-by-marketplace';
import { Injectable } from '@nestjs/common';
import { BrowsersReturn } from '../types/browsers-return.type';
import { zipCodesByMarketPlace } from '../consts/zip-codes-by-marketplace';

@Injectable()
export class CrawlerBrowserManagerService {
  constructor(private readonly userAgentService: UserAgentsService) {}

  async createBrowserInstance() {
    return await puppeteer.launch({
      headless: false,
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });
  }

  async initializeBroserByMarketplace(mp: CRAWLER_MARKETPLACES) {
    const browser = await this.createBrowserInstance();

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(this.userAgentService.getRandomUserAgent());

    await page.goto(initialCrawlLinksByMarketplace[mp], {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.evaluate(
      async (zipCode) => {
        const params = new URLSearchParams({
          actionSource: 'glow',
          deviceType: 'web',
          locationType: 'LOCATION_INPUT',
          pageType: 'Detail',
          storeContext: 'computers',
          zipCode,
        });

        await fetch('/portal-migration/hz/glow/address-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
      },
      zipCodesByMarketPlace[mp], // 👈 pass here!
    );

    return { browser, marketplace: mp };
  }

  async initializeBrowsersWithAppropirateZipCode(): Promise<BrowsersReturn[]> {
    const marketplaces = Object.values(CRAWLER_MARKETPLACES);

    const instances = await Promise.all(
      marketplaces.map(async (mp) => {
        return this.initializeBroserByMarketplace(mp);
      }),
    );

    return instances;
  }
}
