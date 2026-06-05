import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PRODUCT_CONSTANTS } from '../constants/product.constant';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('AWS_ENDPOINT'),
      forcePathStyle:
        this.configService.get<string>('AWS_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY'
        ),
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = PRODUCT_CONSTANTS.STORAGE_FOLDER
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      return getSignedUrl(
        // `getSignedUrl` and `S3Client` can end up with incompatible TS types
        // when the installed `@aws-sdk/*` packages differ in patch versions.
        // Runtime is still correct; this cast makes the compiler agree.
        this.s3Client as unknown as any,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        }),
        { expiresIn: 60 * 60 * 24 * 7 }
      );
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }
}
