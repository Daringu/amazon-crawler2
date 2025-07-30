import { SellersRank } from './sellers-rank.type';

export interface ICrawlerProduct {
  price: number;
  title: string;
  brand: string;
  reviewCount: number;
  stars: number;
  videoCount: number;
  amazonChoice: boolean;
  withAPlusContent: boolean;
  customerSay: string;
  imageCount: number;
  imagesLinks: string[];
  asin: string;
  variations: number[]; // if you know the shape of a variation, replace `any` with the proper type
  link: string;
  soldBy: string;
  dispatchesFrom: string;
  boughtForTheLastMonth: string | null;
  sellerRanks: SellersRank[];
  RRP: number;
}
