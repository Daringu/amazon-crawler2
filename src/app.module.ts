import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { BullModule } from '@nestjs/bullmq';
import { config } from 'dotenv';
import { CustomConfigServiceModule } from './custom-config-service/custom-config-service.module';
import { EnvKeys } from './custom-config-service/consts';
import { CrawlerModule } from './crawler/crawler.module';

config();

const configService = new ConfigService();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,

    BullModule.forRoot({
      connection: {
        host: configService.getOrThrow<string>(EnvKeys.REDIS_URL),
        port: parseInt(configService.getOrThrow<string>(EnvKeys.REDIS_PORT)),
      },
    }),
    CustomConfigServiceModule,
    CrawlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
