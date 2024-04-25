import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { success: boolean, status: number } {
    return { success: true, status: 200 }
  }
}
