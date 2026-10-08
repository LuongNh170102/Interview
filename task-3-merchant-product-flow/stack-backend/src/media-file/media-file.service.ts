import { Injectable } from "@nestjs/common";
import { CreateMediaFileDto } from "./dto/create-media-file.dto";
import { UpdateMediaFileDto } from "./dto/update-media-file.dto";

@Injectable()
export class MediaFileService {
  create(mediaFile: Express.Multer.File) {
    /* const { createReadStream, filename } = await mediaFile;
      if (filename) {
        media_file_name = filename;
        const pathName = join(process.cwd(), `./public/images/${media_file_name}`);
        await createReadStream().pipe(fs.createWriteStream(pathName));
      } */
    return "This action adds a new mediaFile";
  }

  findAll() {
    return `This action returns all mediaFile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mediaFile`;
  }

  update(id: number, updateMediaFileDto: UpdateMediaFileDto) {
    return `This action updates a #${id} mediaFile`;
  }

  remove(id: number) {
    return `This action removes a #${id} mediaFile`;
  }
}
