import TelegramClient from './services/telegramClient';
import * as swapper from './swapper';
const telegramClient = new TelegramClient(process.env.BOT_TOKEN);

function messageIsCommand(message) {
  return message.text && message.text.startsWith('/');
}

function extractCommand(message) {
  return message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/).slice(1);
}

export default class {
  respondTo(message) {
    let promise;

    if (!messageIsCommand(message)) {
      return;
    }

    return this.respondToCommand(extractCommand(message.text)).then(photoStream => {
      telegramClient.sendPhoto(photoStream, message.chat.id);
    }).catch(err => {
      console.log('No response available for message "%s", error: %s', message.text, err);
    });
  }

  respondToCommand([command, args]) {
    return new Promise((resolve, reject) => {
      if (!command) {
        reject('No command provided');
      }

      switch (command) {
      case 'start':
        resolve('TODO: Will provide help!');
      case 'faceWithUrl':
        resolve(this.faceWithUrl(args.split(' '))); // TODO: Split somewhere else
      default:
        reject(`Unknown command ${command}`);
      }
    });
  }

  faceWithUrl([face, url]) {
    return swapper.fetchAndSwap(url, `./img/${face}.png`); // TODO: Dir traversal protection
  }
}
