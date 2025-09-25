import { Column, Entity, ManyToMany, Unique } from 'typeorm';
import { CrawlerProductEntity } from './product.entity';
import { AbstractEntityWithTimestamp } from 'src/database/entity/abstract.entity';

@Unique(['profileId', 'link'])
@Entity()
export class CrawlerRequest extends AbstractEntityWithTimestamp {
  @Column({ type: 'varchar', nullable: false })
  link: string;

  @ManyToMany(() => CrawlerProductEntity, (product) => product.requests)
  products: CrawlerProductEntity[];

  @Column({ nullable: false })
  profileId: number;
}
