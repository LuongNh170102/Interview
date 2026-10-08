import { Module } from '@nestjs/common';
import { MediaFileService } from './media-file.service';
import { MediaFileController } from './media-file.controller';

@Module({
  controllers: [MediaFileController],
  providers: [MediaFileService],
})
export class MediaFileModule {}
