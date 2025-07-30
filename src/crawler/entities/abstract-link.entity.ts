import { AbstractEntity } from 'src/database/entity/abstract.entity';
import { Column } from 'typeorm';
import { CRAWLER_LINK_STATE } from '../types/link-state.type';
import { CRAWLER_MARKETPLACES } from '../consts/marketplaces';

export abstract class CrawlerLink extends AbstractEntity {
  @Column({ nullable: false, unique: true })
  link: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: CRAWLER_LINK_STATE,
    default: CRAWLER_LINK_STATE.NEWLY_DISCOVERED,
  })
  linkState: CRAWLER_LINK_STATE;

  @Column({
    nullable: false,
  })
  marketplace: CRAWLER_MARKETPLACES;
}
