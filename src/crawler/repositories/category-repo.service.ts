import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrawlerCategory } from '../entities/category.entity';

@Injectable()
export class CategoryRepo extends Repository<CrawlerCategory> {
  constructor(
    @InjectRepository(CrawlerCategory)
    readonly repository: Repository<CrawlerCategory>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async getCategoryById(id: number): Promise<CrawlerCategory | null> {
    return this.repository.findOneBy({ id });
  }
}
