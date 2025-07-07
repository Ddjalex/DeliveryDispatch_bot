import TelegramBot from 'node-telegram-bot-api';
import { type Driver, type Order, type Assignment } from '@shared/schema';

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeBot();
  }

  private initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "mock_token";
    
    if (token === "mock_token") {
      console.log("⚠️  Using mock Telegram bot - no actual messages will be sent");
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      this.isInitialized = true;
      console.log("✅ Telegram bot initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Telegram bot:", error);
    }
  }

  async sendAssignmentNotification(driver: Driver, order: Order, assignment: Assignment): Promise<boolean> {
    if (!this.isInitialized || !this.bot) {
      console.log(`📱 [MOCK] Assignment notification for ${driver.name}: Order ${order.orderNumber}`);
      return true; // Return true for mock mode
    }

    // Skip demo users
    if (driver.telegramId === "DEMO_USER") {
      console.log(`📱 [DEMO] Assignment notification for ${driver.name}: Order ${order.orderNumber} (Demo user - no message sent)`);
      return true;
    }

    try {
      const message = this.formatAssignmentMessage(order, assignment);
      
      // Try to send by Telegram ID first, then by chat ID
      let chatId = driver.telegramId;
      
      // If telegramId is numeric, it's likely a chat ID
      if (/^\d+$/.test(driver.telegramId)) {
        chatId = driver.telegramId;
      } else {
        // If it's a username, prepend with @
        chatId = driver.telegramId.startsWith('@') ? driver.telegramId : `@${driver.telegramId}`;
      }

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Accept', callback_data: `accept_${order.id}` },
              { text: '❌ Decline', callback_data: `decline_${order.id}` }
            ]
          ]
        }
      });

      console.log(`✅ Assignment notification sent to ${driver.name} (${driver.telegramId})`);
      return true;
    } catch (error: any) {
      if (error.response?.body?.description?.includes('chat not found')) {
        console.error(`❌ Telegram user ${driver.telegramId} not found. Please check the username/chat ID for ${driver.name}`);
      } else {
        console.error(`❌ Failed to send assignment notification to ${driver.name}:`, error.response?.body || error.message);
      }
      return false;
    }
  }

  private formatAssignmentMessage(order: Order, assignment: Assignment): string {
    const distance = assignment.distance ? `${assignment.distance} km` : 'Unknown';
    
    return `🚗 *New Delivery Assignment*

📦 *Order:* ${order.orderNumber}
🏪 *Restaurant:* ${order.restaurantName}
📍 *Pickup:* Restaurant location
🏠 *Delivery:* ${order.deliveryAddress}
💰 *Amount:* $${order.amount}
📏 *Distance:* ${distance}

⏰ Please respond within 2 minutes`;
  }

  async sendStatusUpdate(driver: Driver, message: string): Promise<boolean> {
    if (!this.isInitialized || !this.bot) {
      console.log(`📱 [MOCK] Status update for ${driver.name}: ${message}`);
      return true;
    }

    try {
      let chatId = driver.telegramId;
      if (!/^\d+$/.test(driver.telegramId)) {
        chatId = driver.telegramId.startsWith('@') ? driver.telegramId : `@${driver.telegramId}`;
      }

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      console.error(`❌ Failed to send status update to ${driver.name}:`, error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const telegramBot = new TelegramBotService();
