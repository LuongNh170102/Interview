import { Injectable } from '@nestjs/common';
import { COMMON_MESSAGES } from './common/constants/messages.constant';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: COMMON_MESSAGES.HELLO_API };
  }
}
