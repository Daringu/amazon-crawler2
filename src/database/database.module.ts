import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { entites } from './consts';
import { EnvKeys } from 'src/custom-config-service/consts';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          url: configService.getOrThrow(EnvKeys.DATABASE_URL),
          ssl:
            configService.get(EnvKeys.IS_LOCAL) === 'true'
              ? undefined
              : {
                  rejectUnauthorized: false,
                },
          entities: entites,
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
