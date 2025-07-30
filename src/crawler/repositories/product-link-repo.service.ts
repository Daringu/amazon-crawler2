import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductLink } from "../entities/product-link.entity";

@Injectable()
export class ProductLinkRepo extends Repository<ProductLink> {
  constructor(
    @InjectRepository(ProductLink)
    readonly repository: Repository<ProductLink>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
