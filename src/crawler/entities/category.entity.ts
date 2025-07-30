import { AbstractEntity } from 'src/database/entity/abstract.entity';
import { Column, Entity, ManyToMany } from 'typeorm';
import { CrawlerProductEntity } from './product.entity';

@Entity()
export class CrawlerCategory extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => CrawlerProductEntity, (product) => product.categories)
  products: CrawlerProductEntity[];
}
