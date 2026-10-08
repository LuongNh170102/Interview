import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import "multer";
import { diskStorage } from "multer";
import { UpdateMediaFileDto } from "./dto/update-media-file.dto";
import { MediaFileService } from "./media-file.service";
import { join, extname } from "path";
@Controller("media-file")
export class MediaFileController {
  constructor(private readonly mediaFileService: MediaFileService) {}

  @Post("upload-file")
  @UseInterceptors(
    FileInterceptor("mediaFile", {
      storage: diskStorage({
        destination: join(process.cwd(), "public", "images"),
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          cb(null, `${randomName}${extname(file.originalname)}`);
        }
      })
    })
  )
  create(@UploadedFile() mediaFile: Express.Multer.File) {
    return mediaFile.filename;
  }

  @Get()
  findAll() {
    return this.mediaFileService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.mediaFileService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateMediaFileDto: UpdateMediaFileDto) {
    return this.mediaFileService.update(+id, updateMediaFileDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.mediaFileService.remove(+id);
  }
}
