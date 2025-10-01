import { AbstractEntity } from 'src/database/entity/abstract.entity';
import { Column, Entity, ManyToMany, Unique } from 'typeorm';
import { CrawlerProductEntity } from './product.entity';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

@Unique(['name', 'marketplace'])
@Entity()
export class CrawlerCategory extends AbstractEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar' })
  marketplace: AMAZON_MARKETPLACES;

  @ManyToMany(() => CrawlerProductEntity, (product) => product.categories)
  products: CrawlerProductEntity[];
}
