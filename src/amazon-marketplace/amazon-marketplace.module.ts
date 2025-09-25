import { Module } from '@nestjs/common';
import { AmazonMarketplaceService } from './amazon-marketplace.service';

@Module({
  providers: [AmazonMarketplaceService],
  exports: [AmazonMarketplaceService],
})
export class AmazonMarketplaceModule {}
