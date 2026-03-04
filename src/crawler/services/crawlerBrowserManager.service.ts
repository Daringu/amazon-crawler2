import * as puppeteer from 'puppeteer';
import { UserAgentsService } from './userAgents.service';
import { Injectable } from '@nestjs/common';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';
import { AmazonMarketplaceService } from 'src/amazon-marketplace/amazon-marketplace.service';

@Injectable()
export class CrawlerBrowserManagerService {
  constructor(
    private readonly userAgentService: UserAgentsService,
    private readonly amazonMarketplaceService: AmazonMarketplaceService,
  ) {}

  async createBrowserInstance() {
    return await puppeteer.launch({
      headless: false,
      // executablePath: '/usr/bin/google-chrome',
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
      ],
    });
  }

  async initializeBroserByMarketplace(
    mp: AMAZON_MARKETPLACES,
    initialLink: string,
  ) {
    const code = this.amazonMarketplaceService.getZipCode(mp);

    if (!code) {
      throw new Error('No zip code');
    }
    const browser = await this.createBrowserInstance();

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(this.userAgentService.getRandomUserAgent());

    await page.goto(initialLink, {
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
      code, // 👈 pass here!
    );
    return { browser, marketplace: mp };
  }
}
