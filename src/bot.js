import TelegramClient from './services/telegramClient';
import * as swapper from './swapper';

const telegramClient = new TelegramClient(process.env.BOT_TOKEN);

const RESPONSE_TYPES = {
  TEXT: 'TEXT',
  PHOTO: 'PHOTO'
};

function messageIsCommand(message) {
  return message.text && message.text.startsWith('/');
}

function extractCommand(message) {
  return message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/).slice(1);
}

export default class {
  respondTo(message) {
    if (!messageIsCommand(message)) {
      return;
    }

    return this.respondToCommand(extractCommand(message.text)).then(commandResponse => {
      switch (commandResponse.type) {
        case RESPONSE_TYPES.TEXT:
          telegramClient.sendText(commandResponse.content, message.chat.id);
          break;
        case RESPONSE_TYPES.PHOTO:
          telegramClient.sendPhoto(commandResponse.content, message.chat.id);
          break;
      }
    }).catch(err => {
      console.log('No response available for message "%s", error: %s', message.text, err.stack);
    });
  }

  respondToCommand([command, args]) {
    return new Promise((resolve, reject) => {
      if (!command) {
        reject('No command provided');
      }

      switch (command) {
      case 'start':
        resolve({
          type: RESPONSE_TYPES.TEXT,
          content: 'TODO: Will provide help!'
        });
        break;
      case 'faceWithUrl':
        resolve({
          type: RESPONSE_TYPES.PHOTO,
          content: this.faceWithUrl(args.split(' ')) // TODO: Split somewhere else
        });
        break;
      default:
        reject(`Unknown command ${command}`);
      }
    });
  }

  faceWithUrl([face, url]) {
    return swapper.fetchAndSwap(url, face);
  }
}
