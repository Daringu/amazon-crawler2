import { AbstractEntityWithTimestamp } from 'src/database/entity/abstract.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { CrawlerCategory } from './category.entity';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

// Define composite unique constraint
@Entity()
@Unique(['asin', 'marketplace'])
export class CrawlerProductEntity extends AbstractEntityWithTimestamp {
  @ManyToOne(() => CrawlerCategory, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  category: CrawlerCategory;

  @Column({ nullable: false })
  asin: string;

  @Column()
  link: string;

  @Column('varchar', { nullable: true })
  title: string | null;

  @Column('varchar', { nullable: true })
  brand: string | null;

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

  @Column('integer', { nullable: true, default: 0 })
  imageCount: number | null;

  @Column('text', { array: true, nullable: true })
  imagesLinks: string[];

  @Column('integer', { array: true, nullable: true })
  variations: number[];

  @Column('varchar', { nullable: true })
  soldBy: string | null;

  @Column('varchar', { nullable: true })
  dispatchesFrom: string | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  boughtForTheLastMonth: number;

  @Column('varchar', { nullable: false })
  marketplace: AMAZON_MARKETPLACES;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  rating: number | null;

  @Column('integer', { nullable: true, default: 0 })
  reviews: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  RRP: number;

  @Column('integer', { nullable: true, default: 0 })
  rank: number | null;
}
