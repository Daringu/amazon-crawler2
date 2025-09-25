import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrawlerRequest } from '../entities/crawl-request.entity';

@Injectable()
export class CrawlerRequestRepo extends Repository<CrawlerRequest> {
  constructor(
    @InjectRepository(CrawlerRequest)
    readonly repository: Repository<CrawlerRequest>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
