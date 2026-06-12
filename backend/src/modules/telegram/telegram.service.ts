import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftLog } from '../../schemas/shift-log.schema';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string | null = null;
  private chatId: string | null = null;
  private sentWarnings = new Set<string>();

  constructor(
    @InjectModel(ShiftLog.name) private readonly shiftLogModel: Model<ShiftLog>,
  ) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.chatId = process.env.TELEGRAM_CHAT_ID || null;
  }

  onModuleInit() {
    this.logger.log('Khởi chạy daemon giám sát deadline Telegram Bot...');
    // Quét mỗi 60 giây để kiểm thử thời gian thực nhanh nhạy
    setInterval(() => {
      this.scanDeadlines().catch(err => {
        this.logger.error('Lỗi khi quét hạn chót tác vụ:', err);
      });
    }, 60000);
  }

  async sendMessage(text: string): Promise<void> {
    // Check if token and chat ID are configured
    const isConfigured = 
      this.botToken && 
      this.botToken !== 'YOUR_BOT_TOKEN' && 
      this.chatId && 
      this.chatId !== 'YOUR_CHAT_ID';

    if (isConfigured) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: 'HTML',
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          this.logger.error(`Gửi tin nhắn Telegram thất bại: ${errText}`);
        }
      } catch (err) {
        this.logger.error('Lỗi kết nối API Telegram:', err);
      }
    } else {
      // Simulation Mode inside terminal log
      console.log('\n========================================================================');
      console.log('[TELEGRAM SIMULATION BOT ALERT]');
      console.log(`Nội dung: ${text.replace(/<[^>]*>/g, '')}`); // Strip HTML tags for console printing
      console.log('========================================================================\n');
    }
  }

  async scanDeadlines(): Promise<void> {
    // Vietnam Time (GMT+7)
    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowVN.toISOString().split('T')[0];

    const currentHour = nowVN.getUTCHours();
    const currentMin = nowVN.getUTCMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    // Find active pending shifts for today
    const activeShifts = await this.shiftLogModel.find({
      status: 'PENDING',
      shiftDate: todayStr,
    })
    .populate('userId', 'fullName username')
    .populate({
      path: 'templateId',
      select: 'title'
    })
    .exec();

    for (const shift of activeShifts) {
      for (const item of shift.details) {
        if (!item.isChecked && item.deadlineSnapshot) {
          const [deadHour, deadMin] = item.deadlineSnapshot.split(':').map(Number);
          if (isNaN(deadHour) || isNaN(deadMin)) continue;

          const deadTotalMins = deadHour * 60 + deadMin;
          const minsDiff = deadTotalMins - currentTotalMins;

          // Cảnh báo nếu sắp đến deadline (trong vòng 15 phút) hoặc đã trễ hạn
          if (minsDiff <= 15) {
            const warningType = minsDiff < 0 ? 'OVERDUE' : 'COMING_SOON';
            const cacheKey = `${shift._id}-${item.taskId}-${warningType}`;

            if (!this.sentWarnings.has(cacheKey)) {
              this.sentWarnings.add(cacheKey);

              const titleText = warningType === 'OVERDUE' 
                ? `🚨 <b>[CẢNH BÁO QUÁ HẠN CHÓT]</b>` 
                : `⚠️ <b>[CẢNH BÁO SẮP ĐẾN HẠN CHÓT]</b>`;

              const timeText = warningType === 'OVERDUE'
                ? `Đã trễ <b>${Math.abs(minsDiff)} phút</b> so với hạn chót (${item.deadlineSnapshot})`
                : `Chỉ còn <b>${minsDiff} phút</b> nữa đến hạn chót (${item.deadlineSnapshot})`;

              const message = `${titleText}\n` +
                `• Tác vụ: <b>${item.taskId} - ${item.taskNameSnapshot}</b>\n` +
                `• Mức độ ưu tiên: <b>${item.prioritySnapshot}</b>\n` +
                `• Thời hạn: ${timeText}\n` +
                `• Nhân sự trực chính: <b>${(shift.userId as any)?.fullName || 'Chưa rõ'}</b>\n` +
                `• Ca trực: <i>${(shift.templateId as any)?.title || 'Ca vận hành'}</i>\n\n` +
                `Đề nghị đồng chí trực ban khẩn trương kiểm tra và xử lý gấp!`;

              await this.sendMessage(message);
            }
          }
        }
      }
    }
  }
}
