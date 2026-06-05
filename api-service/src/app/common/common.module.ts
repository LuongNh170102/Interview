import { Module, Global } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [StorageService, CacheService],
  exports: [StorageService, CacheService],
})
export class CommonModule {}
