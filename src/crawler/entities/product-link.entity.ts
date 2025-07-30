import { Entity } from 'typeorm';
import { CrawlerLink } from './abstract-link.entity';

@Entity()
export class ProductLink extends CrawlerLink {}
