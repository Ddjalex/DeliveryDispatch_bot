import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';

class DriverRegistrationBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeBot();
  }

  private initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    
    if (!token || token === "mock_token") {
      console.log("⚠️  Driver registration bot - no valid token provided");
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.isInitialized = true;
      this.setupHandlers();
      console.log("✅ Driver registration bot initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize driver registration bot:", error);
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `🚗 Welcome to ET_FOOD Driver Registration!

To become a driver with ET_FOOD, please click the button below to open our registration form.

You'll need to provide:
📋 Personal information
🆔 Identity documents (Driver License, Kebele ID)  
🚗 Vehicle information
📱 Profile photo and location

The process takes about 5-10 minutes to complete.`;

      const keyboard = {
        inline_keyboard: [[
          {
            text: "📝 Start Registration",
            web_app: {
              url: `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/driver-registration`
            }
          }
        ]]
      };

      this.bot!.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      });
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const driver = await storage.getDriverByTelegramId(chatId.toString());
        
        if (driver) {
          const statusMessage = `👤 *Driver Status*

🆔 Name: ${driver.name}
📱 Phone: ${driver.phone}
📍 Status: ${driver.isOnline ? (driver.isAvailable ? '🟢 Available' : '🔴 Busy') : '⚫ Offline'}
📊 Total Deliveries: Coming soon...

Use /help for available commands.`;

          this.bot!.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
        } else {
          this.bot!.sendMessage(chatId, `❌ You are not registered as a driver yet. Use /start to begin registration.`);
        }
      } catch (error) {
        this.bot!.sendMessage(chatId, `❌ Error checking status. Please try again later.`);
      }
    });

    // Handle /help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `🤖 *ET_FOOD Driver Bot Commands*

/start - Begin driver registration
/status - Check your driver status
/available - Mark yourself as available
/busy - Mark yourself as busy
/offline - Go offline
/help - Show this help message

For support, contact: support@etfood.com`;

      this.bot!.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Handle availability commands
    this.bot.onText(/\/available/, async (msg) => {
      await this.updateDriverStatus(msg.chat.id, { isAvailable: true, isOnline: true });
    });

    this.bot.onText(/\/busy/, async (msg) => {
      await this.updateDriverStatus(msg.chat.id, { isAvailable: false, isOnline: true });
    });

    this.bot.onText(/\/offline/, async (msg) => {
      await this.updateDriverStatus(msg.chat.id, { isAvailable: false, isOnline: false });
    });

    // Handle callback queries (button presses)
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId || !data) return;

      if (data.startsWith('accept_') || data.startsWith('decline_')) {
        const orderId = parseInt(data.split('_')[1]);
        const action = data.split('_')[0];
        
        try {
          if (action === 'accept') {
            await storage.updateOrderStatus(orderId, 'picked_up');
            this.bot!.answerCallbackQuery(query.id, { text: '✅ Order accepted!' });
            this.bot!.sendMessage(chatId, `✅ You have accepted the order! Please proceed to the restaurant for pickup.`);
          } else {
            // Handle decline - make driver available again and find new driver
            const assignment = await storage.getAssignmentByOrderId(orderId);
            if (assignment) {
              await storage.updateDriverAvailability(assignment.driverId, true);
            }
            this.bot!.answerCallbackQuery(query.id, { text: '❌ Order declined' });
            this.bot!.sendMessage(chatId, `❌ Order declined. You are now available for new orders.`);
          }
        } catch (error) {
          this.bot!.answerCallbackQuery(query.id, { text: 'Error processing request' });
        }
      }
    });

    // Handle web app data (registration completion)
    this.bot.on('web_app_data', async (msg) => {
      const chatId = msg.chat.id;
      const data = JSON.parse(msg.web_app?.data || '{}');
      
      try {
        // Create driver account with registration data
        const driver = await storage.createDriver({
          name: `${data.firstName} ${data.lastName}`,
          telegramId: chatId.toString(),
          phone: data.phone,
          latitude: data.latitude || "0",
          longitude: data.longitude || "0",
          isAvailable: true,
          isOnline: true
        });

        const successMessage = `🎉 *Registration Completed Successfully!*

Welcome to ET_FOOD, ${data.firstName}!

Your driver account has been created and is now under review. You will receive approval notification within 24 hours.

Driver ID: ${driver.id}
Status: Pending Approval

Available commands:
/status - Check your status
/help - View all commands`;

        this.bot!.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        this.bot!.sendMessage(chatId, `❌ Registration failed. Please try again or contact support.`);
      }
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  private async updateDriverStatus(chatId: number, status: { isAvailable?: boolean; isOnline?: boolean }) {
    try {
      const driver = await storage.getDriverByTelegramId(chatId.toString());
      
      if (!driver) {
        this.bot!.sendMessage(chatId, `❌ You are not registered as a driver. Use /start to register.`);
        return;
      }

      if (status.isAvailable !== undefined) {
        await storage.updateDriverAvailability(driver.id, status.isAvailable);
      }
      
      if (status.isOnline !== undefined) {
        await storage.updateDriverOnlineStatus(driver.id, status.isOnline);
      }

      const statusText = status.isOnline === false ? '⚫ Offline' : 
                        status.isAvailable === false ? '🔴 Busy' : '🟢 Available';
      
      this.bot!.sendMessage(chatId, `✅ Status updated to: ${statusText}`);
    } catch (error) {
      this.bot!.sendMessage(chatId, `❌ Failed to update status. Please try again.`);
    }
  }

  async sendNotificationToDriver(chatId: string, message: string): Promise<boolean> {
    if (!this.isInitialized || !this.bot) return false;

    try {
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      console.error(`Failed to send notification to ${chatId}:`, error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const driverRegistrationBot = new DriverRegistrationBot();