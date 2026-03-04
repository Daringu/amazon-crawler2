import { AbstractEntity } from 'src/database/entity/abstract.entity';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { CrawlerProductEntity } from './product.entity';
import { AMAZON_MARKETPLACES } from 'src/amazon-marketplace/consts';

@Unique(['name', 'marketplace'])
@Entity()
export class CrawlerCategory extends AbstractEntity {
  @Column()
  name: string;

  @Column({ nullable: false, type: 'varchar' })
  marketplace: AMAZON_MARKETPLACES;

  @OneToMany(() => CrawlerProductEntity, (product) => product.category, {
    cascade: true,
  })
  products: CrawlerProductEntity[];

  @Column()
  link: string;

  @Column('boolean', { default: false })
  loading: boolean;
}
