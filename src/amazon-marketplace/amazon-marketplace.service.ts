import { Injectable } from '@nestjs/common';
import { AMAZON_MARKETPLACES } from './consts';

@Injectable()
export class AmazonMarketplaceService {
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

  getZipCode(marketplace: AMAZON_MARKETPLACES) {
    const zip = this.AMAZON_MARKETPLACE_ZIPCODES[marketplace];

    if (!zip) {
      return null;
    }

    return zip;
  }
}
