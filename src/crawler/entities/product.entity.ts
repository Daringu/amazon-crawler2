import { AbstractEntityWithTimestamp } from 'src/database/entity/abstract.entity';
import { Column, Entity, JoinTable, ManyToMany, Unique } from 'typeorm';
import { CrawlerCategory } from './category.entity';
import { SellersRank } from '../types/sellers-rank.type';
import { CrawlerRequest } from './crawl-request.entity';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

// Define composite unique constraint
@Entity()
@Unique(['asin', 'marketplace'])
export class CrawlerProductEntity extends AbstractEntityWithTimestamp {
  @ManyToMany(() => CrawlerCategory, (category) => category.products)
  @JoinTable()
  categories: CrawlerCategory[];

  @ManyToMany(() => CrawlerRequest, (request) => request.products)
  @JoinTable()
  requests: CrawlerRequest[];

  @Column({ nullable: false })
  asin: string;

  @Column()
  link: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  brand: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true, default: 0 })
  reviewCount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  stars: number;

  @Column({ nullable: true })
  videoCount: number;

  @Column({ default: false })
  amazonChoice: boolean;

  @Column({ default: false })
  withAPlusContent: boolean;

  @Column({ type: 'text', nullable: true })
  customerSay: string;

  @Column({ nullable: true, default: 0 })
  imageCount: number;

  @Column('text', { array: true, nullable: true })
  imagesLinks: string[];

  @Column('integer', { array: true, nullable: true })
  variations: number[];

  @Column({ nullable: true })
  soldBy: string;

  @Column({ nullable: true })
  dispatchesFrom: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  boughtForTheLastMonth: number;

  @Column('jsonb', { nullable: true })
  sellerRanks: Array<SellersRank>;

  @Column({ nullable: false, type: 'varchar' })
  marketplace: AMAZON_MARKETPLACES;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  RRP: number;
}
