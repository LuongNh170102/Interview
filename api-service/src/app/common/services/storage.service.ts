import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
          ACL: 'public-read', // Make file public
        })
      );

      // Construct Public URL
      // Local MinIO: http://localhost:9000/bucket-name/filename
      // AWS S3: https://bucket-name.s3.region.amazonaws.com/filename

      const endpoint = this.configService.get<string>('AWS_ENDPOINT');
      if (endpoint && endpoint.includes('localhost')) {
        return `${endpoint}/${this.bucketName}/${fileName}`;
      }

      // For Production (Standard S3 URL structure)
      const region = this.configService.get<string>('AWS_REGION');
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }
}
