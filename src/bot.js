import TelegramClient from './services/telegramClient';
import * as swapper from './swapper';

const RESPONSE_TYPES = {
  TEXT: 'TEXT',
  PHOTO: 'PHOTO'
};

/**
 * Checks if the given message is a valid command.
 * A message is a command if its text starts with '/'.
 * @param  {object} message Message from Telegram.
 * @return {boolean}        Whether the message is a valid command.
 */
function messageIsCommand(message) {
  return message.text && message.text.startsWith('/');
}

/**
 * Extracts the command from the message and returns its composing parts.
 * A command has the format:
 *
 * /<command>[@<botName>] <param1> <param2> ... <paramN>
 *
 * The @<botName> is optionally sent by Telegram to identify a Bot in a group. It's discarded.
 * @param  {object}   message Message from Telegram.
 * @return {string[]}         An array that has the command without the / as it first element, and any parameters following.
 */
function extractCommand(message) {
  return message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/).slice(1);
}

/**
 * @class Bot to respond to messages from Telegram users.
 */
export default class {
  /**
   * @param  {TelegramClient} [options.client] Inject a Telegram client, otherwise it will instantiate a new one.
   */
  constructor({ client = new TelegramClient(process.env.BOT_TOKEN) } = {}) {
    this.client = client;
  }

  /**
   * Responds to a given command from Telegram.
   * @param  {object} message         A message from Telegram.
   * @param  {string} message.text    It should be a command in the form of `/command <param1> <param2>`
   * @param  {number} message.chat.id Id of the chat to respond to.
   * @return {Promise|undefined}      A promise that won't resolve to anything useful yet. `undefined` if the message
   *                                  is not a command.
   */
  respondTo(message) {
    if (!messageIsCommand(message)) {
      return; // TODO: Move to the promise flow and reject it in this case
    }

    return this.respondToCommand(extractCommand(message.text), message.chat.id).then(commandResponse => {
      // TODO: Make this promise resolve to something useful, or at a useful moment, like when the request to Telegram has
      // succeeded.
      switch (commandResponse.type) {
        case RESPONSE_TYPES.TEXT:
          this.client.sendText(commandResponse.content, message.chat.id);
          break;
        case RESPONSE_TYPES.PHOTO:
          this.client.sendPhoto(commandResponse.content, message.chat.id);
          break;
      }
    }).catch(err => {
      console.log('No response available for message "%s", error: %s', message.text, err.stack);
      throw err;
    });
  }

  respondToCommand([command, args], chatId) {
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
          content: this.faceWithUrl(args.split(' '), chatId) // TODO: Split somewhere else
        });
        break;
      default:
        throw new Error(`Unknown command ${command}`);
      }
    });
  }

  faceWithUrl([face, url], chatId) {
    return swapper.fetchAndSwap(url, face, chatId);
  }
}
