import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAgentsService {
  private readonly USER_AGENTS = [
    // Chrome on Windows 10
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',

    // Firefox on Windows 10
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',

    // Edge on Windows 10
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.1901.188 Safari/537.36 Edg/115.0.1901.188',

    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',

    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',

    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.5; rv:116.0) Gecko/20100101 Firefox/116.0',
  ];

  /**
   * Returns the full list of user agents
   */
  get userAgents(): string[] {
    return this.USER_AGENTS;
  }

  /**
   * Returns a random user agent string
   */
  getRandomUserAgent(): string {
    const idx = Math.floor(Math.random() * this.USER_AGENTS.length);
    return this.USER_AGENTS[idx];
  }
}
