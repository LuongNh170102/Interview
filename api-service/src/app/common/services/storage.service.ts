import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { PRODUCT_CONSTANTS } from '../constants/product.constant';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly forcePathStyle: boolean;
  private bucketPolicyEnsured = false;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.endpoint = this.configService.get<string>('AWS_ENDPOINT') ?? '';
    this.region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
    this.forcePathStyle =
      this.configService.get<string>('AWS_FORCE_PATH_STYLE') === 'true';

    this.s3Client = this.createClient({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? '',
      secretAccessKey:
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = PRODUCT_CONSTANTS.STORAGE_FOLDER
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.putObject(this.s3Client, fileName, file);
    } catch (error) {
      const recoveredClient = await this.recoverLocalClient(error);

      if (!recoveredClient) {
        this.logger.error(`Failed to upload file: ${error.message}`);
        throw error;
      }

      await this.putObject(recoveredClient, fileName, file);
    }

    // Construct Public URL
    // Local MinIO: http://localhost:9000/bucket-name/filename
    // AWS S3: https://bucket-name.s3.region.amazonaws.com/filename

    if (this.endpoint && this.isLocalEndpoint()) {
      return `${this.endpoint}/${this.bucketName}/${fileName}`;
    }

    // For Production (Standard S3 URL structure)
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
  }

  private createClient(credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  }): S3Client {
    return new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials,
    });
  }

  private async putObject(
    client: S3Client,
    fileName: string,
    file: Express.Multer.File
  ): Promise<void> {
    await this.ensureBucketExists(client);
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
    );
  }

  private async ensureBucketExists(client: S3Client): Promise<void> {
    try {
      await client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error) {
      if (!this.isMissingBucketError(error)) {
        throw error;
      }

      try {
        await client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
      } catch (createError) {
        if (!this.isBucketAlreadyExistsError(createError)) {
          throw createError;
        }
      }
    }

    await this.ensureBucketPublic(client);
  }

  private async ensureBucketPublic(client: S3Client): Promise<void> {
    if (!this.isLocalEndpoint() || this.bucketPolicyEnsured) {
      return;
    }

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    await client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy),
      })
    );

    this.bucketPolicyEnsured = true;
  }

  private async recoverLocalClient(error: unknown): Promise<S3Client | null> {
    if (!this.isLocalEndpoint() || !this.isInvalidCredentialError(error)) {
      return null;
    }

    this.logger.warn(
      'Retrying local object storage with MinIO default credentials.'
    );

    const fallbackClient = this.createClient({
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    });

    this.s3Client = fallbackClient;
    return fallbackClient;
  }

  private isLocalEndpoint(): boolean {
    return (
      this.endpoint.includes('localhost') || this.endpoint.includes('127.0.0.1')
    );
  }

  private isInvalidCredentialError(error: unknown): boolean {
    const code = this.readErrorCode(error);
    const httpStatusCode = this.readHttpStatusCode(error);

    return (
      code === 'InvalidAccessKeyId' ||
      code === 'SignatureDoesNotMatch' ||
      httpStatusCode === 403
    );
  }

  private isMissingBucketError(error: unknown): boolean {
    const code = this.readErrorCode(error);
    return code === 'NotFound' || code === 'NoSuchBucket';
  }

  private isBucketAlreadyExistsError(error: unknown): boolean {
    const code = this.readErrorCode(error);
    return code === 'BucketAlreadyOwnedByYou' || code === 'BucketAlreadyExists';
  }

  private readErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    return (
      (error as { Code?: string }).Code ??
      (error as { name?: string }).name ??
      (error as { code?: string }).code
    );
  }

  private readHttpStatusCode(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    return (error as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode;
  }
}
