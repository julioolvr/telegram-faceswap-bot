import Bot from './bot';

const ALLOWED_CHAT_IDS = process.env.ALLOWED_CHAT_IDS.split(';');

class App {
  start() {
    const bot = new Bot(process.env.BOT_TOKEN);

    bot.onMessage(msg => {
      if (!ALLOWED_CHAT_IDS.includes(msg.chat.id.toString())) {
        console.log('Got message from unknown id', msg.chat.id);
        return false;
      }

      bot.respondTo(msg);
    });
  }
}

export default App;
