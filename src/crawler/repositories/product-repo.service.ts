import { Injectable } from "@nestjs/common";
import { CrawlerProductEntity } from "../entities/product.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ProductRepo extends Repository<CrawlerProductEntity> {
  constructor(
    @InjectRepository(CrawlerProductEntity)
    readonly repository: Repository<CrawlerProductEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
