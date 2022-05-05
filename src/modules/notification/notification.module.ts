import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationService } from './notification.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [MailModule],
  providers: [NotificationService, TelegramService],
  exports: [NotificationService, TelegramService], // 👈 export for DI
})
export class NotificationModule {}
