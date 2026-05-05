import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): object {
    return { status: 'ok', app: 'Estrogen Pharmacy API', version: '0.1.0' };
  }
}
