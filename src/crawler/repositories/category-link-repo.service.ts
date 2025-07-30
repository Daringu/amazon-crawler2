import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryLink } from '../entities/category-link.entity';

@Injectable()
export class CategoryLinkRepo extends Repository<CategoryLink> {
  constructor(
    @InjectRepository(CategoryLink)
    readonly repository: Repository<CategoryLink>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
