import { Injectable } from '@nestjs/common';
import { EnvKeys } from './consts';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomConfigService {
  private envKeyValue: Record<EnvKeys, string>;
  public envKeys = EnvKeys;

  constructor(private readonly configService: ConfigService) {
    this.envKeyValue = Object.values(EnvKeys).reduce(
      (acc, key) => {
        acc[key] = this.configService.getOrThrow<string>(key);
        return acc;
      },
      {} as Record<EnvKeys, string>,
    );
  }

  get(key: EnvKeys): string {
    return this.envKeyValue[key];
  }

  getString(key: EnvKeys): string {
    return this.envKeyValue[key];
  }

  getNumber(key: EnvKeys): number {
    const value = this.envKeyValue[key];
    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new Error(`Expected number for key ${key}, got "${value}"`);
    }
    return parsed;
  }

  getBoolean(key: EnvKeys): boolean {
    const value = this.envKeyValue[key].toLowerCase();
    if (value !== 'true' && value !== 'false') {
      throw new Error(
        `Expected boolean ("true"/"false") for key ${key}, got "${value}"`,
      );
    }
    return value === 'true';
  }

  getJson<T>(key: EnvKeys): T {
    const value = this.envKeyValue[key];
    try {
      return JSON.parse(value) as T;
    } catch (err) {
      throw new Error(
        `Invalid JSON for key ${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  getEnum<T extends Record<string, string | number>>(
    key: EnvKeys,
    enumType: T,
  ): T[keyof T] {
    const value = this.envKeyValue[key];
    const enumValues = Object.values(enumType);

    if (!enumValues.includes(value as string | number)) {
      throw new Error(
        `Invalid enum value for key ${key}. Got "${value}", expected one of ${enumValues.join(', ')}`,
      );
    }

    return value as T[keyof T];
  }
}
