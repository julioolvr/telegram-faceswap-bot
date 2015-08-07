import Bot from './bot';
import TelegramClient from './services/telegramClient';

const bot = new Bot();
const telegramClient = new TelegramClient(process.env.BOT_TOKEN);

const allowedChatIds = process.env.ALLOWED_CHAT_IDS.split(';');

class App {
  start() {
    this.waitForNextResponse();
  }

  waitForNextResponse() {
    console.log('allowed ids are', allowedChatIds);
    telegramClient.getUpdates().then(messages => {
      messages.forEach(message => {
        if (allowedChatIds.indexOf(message.chat.id.toString()) === -1) {
          console.log('Unkown message from chat id', message.chat.id, message);
          return;
        }

        bot.respondTo(message);
      });
      this.waitForNextResponse();
    });
  }
}

export default App;
