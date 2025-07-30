import { Global, Module } from '@nestjs/common';
import { CustomConfigService } from './custom-config-service.service';

@Global()
@Module({
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigServiceModule {}
