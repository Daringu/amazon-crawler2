import { Injectable, Logger } from '@nestjs/common';
import { AMAZON_MARKETPLACES } from './consts';

@Injectable()
export class AmazonMarketplaceService {
  private readonly logger = new Logger(AmazonMarketplaceService.name);
  AMAZON_MARKETPLACE_DOMAINS: Record<AMAZON_MARKETPLACES, string> = {
    [AMAZON_MARKETPLACES.Canada]: 'amazon.ca',
    [AMAZON_MARKETPLACES.UnitedStates]: 'amazon.com',
    [AMAZON_MARKETPLACES.Mexico]: 'amazon.com.mx',
    [AMAZON_MARKETPLACES.Brazil]: 'amazon.com.br',
    [AMAZON_MARKETPLACES.Spain]: 'amazon.es',
    [AMAZON_MARKETPLACES.UnitedKingdom]: 'amazon.co.uk',
    [AMAZON_MARKETPLACES.France]: 'amazon.fr',
    [AMAZON_MARKETPLACES.Belgium]: 'amazon.com.be',
    [AMAZON_MARKETPLACES.Netherlands]: 'amazon.nl',
    [AMAZON_MARKETPLACES.Germany]: 'amazon.de',
    [AMAZON_MARKETPLACES.Italy]: 'amazon.it',
    [AMAZON_MARKETPLACES.Sweden]: 'amazon.se',
    [AMAZON_MARKETPLACES.SouthAfrica]: 'amazon.co.za',
    [AMAZON_MARKETPLACES.Poland]: 'amazon.pl',
    [AMAZON_MARKETPLACES.Egypt]: 'amazon.eg',
    [AMAZON_MARKETPLACES.Turkey]: 'amazon.com.tr',
    [AMAZON_MARKETPLACES.SaudiArabia]: 'amazon.sa',
    [AMAZON_MARKETPLACES.UnitedArabEmirates]: 'amazon.ae',
    [AMAZON_MARKETPLACES.India]: 'amazon.in',
    [AMAZON_MARKETPLACES.Singapore]: 'amazon.sg',
    [AMAZON_MARKETPLACES.Australia]: 'amazon.com.au',
    [AMAZON_MARKETPLACES.Japan]: 'amazon.co.jp',
    [AMAZON_MARKETPLACES.Ireland]: 'amazon.ie',
  };

  MARKETPLACE_LANGUAGE: Record<AMAZON_MARKETPLACES, string> = {
    [AMAZON_MARKETPLACES.UnitedStates]: 'en_US',
    [AMAZON_MARKETPLACES.Canada]: 'en_US',
    [AMAZON_MARKETPLACES.Mexico]: 'en_US',
    [AMAZON_MARKETPLACES.Brazil]: 'en_US',
    [AMAZON_MARKETPLACES.UnitedKingdom]: 'en_GB',
    [AMAZON_MARKETPLACES.Ireland]: 'en_GB',
    [AMAZON_MARKETPLACES.Germany]: 'en_GB',
    [AMAZON_MARKETPLACES.France]: 'en_GB',
    [AMAZON_MARKETPLACES.Spain]: 'en_GB',
    [AMAZON_MARKETPLACES.Italy]: 'en_GB',
    [AMAZON_MARKETPLACES.Netherlands]: 'en_GB',
    [AMAZON_MARKETPLACES.Belgium]: 'en_GB',
    [AMAZON_MARKETPLACES.Sweden]: 'en_GB',
    [AMAZON_MARKETPLACES.Poland]: 'en_GB',
    [AMAZON_MARKETPLACES.Turkey]: 'en_GB',
    [AMAZON_MARKETPLACES.Egypt]: 'en_GB',
    [AMAZON_MARKETPLACES.SaudiArabia]: 'en_GB',
    [AMAZON_MARKETPLACES.UnitedArabEmirates]: 'en_GB',
    [AMAZON_MARKETPLACES.SouthAfrica]: 'en_GB',
    [AMAZON_MARKETPLACES.India]: 'en_GB',
    [AMAZON_MARKETPLACES.Singapore]: 'en_GB',
    [AMAZON_MARKETPLACES.Australia]: 'en_GB',
    [AMAZON_MARKETPLACES.Japan]: 'en_GB', // Japan doesn't really expose full English, but `en_GB` gives partial EN
  };

  AMAZON_MARKETPLACE_ZIPCODES: Record<AMAZON_MARKETPLACES, string> = {
    [AMAZON_MARKETPLACES.Canada]: 'M5A 1A1', // Toronto
    [AMAZON_MARKETPLACES.UnitedStates]: '10001', // New York
    [AMAZON_MARKETPLACES.Mexico]: '01000', // Mexico City
    [AMAZON_MARKETPLACES.Brazil]: '01000-000', // São Paulo
    [AMAZON_MARKETPLACES.Spain]: '28001', // Madrid
    [AMAZON_MARKETPLACES.UnitedKingdom]: 'EC1A 1BB', // London
    [AMAZON_MARKETPLACES.France]: '75001', // Paris
    [AMAZON_MARKETPLACES.Belgium]: '1000', // Brussels
    [AMAZON_MARKETPLACES.Netherlands]: '1011', // Amsterdam
    [AMAZON_MARKETPLACES.Germany]: '10115', // Berlin
    [AMAZON_MARKETPLACES.Italy]: '00184', // Rome
    [AMAZON_MARKETPLACES.Sweden]: '11120', // Stockholm
    [AMAZON_MARKETPLACES.SouthAfrica]: '2000', // Johannesburg
    [AMAZON_MARKETPLACES.Poland]: '00-001', // Warsaw
    [AMAZON_MARKETPLACES.Egypt]: '11511', // Cairo
    [AMAZON_MARKETPLACES.Turkey]: '34000', // Istanbul
    [AMAZON_MARKETPLACES.SaudiArabia]: '11564', // Riyadh
    [AMAZON_MARKETPLACES.UnitedArabEmirates]: '00000', // UAE (no strict postal codes, often 00000)
    [AMAZON_MARKETPLACES.India]: '110001', // New Delhi
    [AMAZON_MARKETPLACES.Singapore]: '018989', // Marina Bay
    [AMAZON_MARKETPLACES.Australia]: '2000', // Sydney
    [AMAZON_MARKETPLACES.Japan]: '100-0001', // Tokyo
    [AMAZON_MARKETPLACES.Ireland]: 'D01 F5P2', // Dublin
  };

  isLinkFromMarketplace(
    marketplace: AMAZON_MARKETPLACES,
    link: string,
  ): boolean {
    try {
      const domain = this.AMAZON_MARKETPLACE_DOMAINS[marketplace];
      const url = new URL(link);

      // Normalize both hostnames to lower-case for comparison
      return url.hostname.toLowerCase().endsWith(domain.toLowerCase());
    } catch (e) {
      this.logger.error(e);
      // Invalid URL
      return false;
    }
  }

  getZipCode(marketplace: AMAZON_MARKETPLACES) {
    const zip = this.AMAZON_MARKETPLACE_ZIPCODES[marketplace];

    if (!zip) {
      return null;
    }

    return zip;
  }

  getMarketplaceFromLink(link: string): AMAZON_MARKETPLACES | null {
    try {
      const url = new URL(link);
      const hostname = url.hostname.toLowerCase();

      // Loop over the domain map and check if the hostname matches
      for (const [marketplace, domain] of Object.entries(
        this.AMAZON_MARKETPLACE_DOMAINS,
      )) {
        if (hostname.endsWith(domain.toLowerCase())) {
          return marketplace as AMAZON_MARKETPLACES;
        }
      }

      return null; // No match found
    } catch (e) {
      this.logger.error(e);
      return null; // Invalid URL
    }
  }

  getMarketplaceLanguage(mp: AMAZON_MARKETPLACES) {
    return this.MARKETPLACE_LANGUAGE[mp];
  }
}
