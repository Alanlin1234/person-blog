import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get('SMTP_PORT') || 587),
        secure: false,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async send(to: string, subject: string, html: string, text?: string) {
    const from = this.config.get<string>('SMTP_FROM') || 'noreply@example.com';
    if (!this.transporter) {
      console.log('[Mail DEV]', { to, subject, text: text || html.slice(0, 200) });
      return;
    }
    await this.transporter.sendMail({ from, to, subject, html, text });
  }
}
