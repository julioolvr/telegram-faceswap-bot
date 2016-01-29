import TelegramClient from './services/telegramClient';
import Command from './command';
import { COMMANDS } from './command';
import * as swapper from './swapper';

const RESPONSE_TYPES = {
  TEXT: 'TEXT',
  PHOTO: 'PHOTO'
};

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
    if (!Command.messageIsCommand(message)) {
      return; // TODO: Move to the promise flow and reject it in this case
    }

    var command = Command.build(message);

    return this.respondToCommand(command, message.chat.id).then(commandResponse => {
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
      console.log('No response available for message "%s", error: %s', message.text, err, err.stack);
      throw err;
    });
  }

  respondToCommand(command, chatId) {
    return new Promise((resolve, reject) => {
      if (!command.isValid()) {
        reject('Invalid command');
      }

      switch (command.getType()) {
      case COMMANDS.START:
        resolve({
          type: RESPONSE_TYPES.TEXT,
          content: 'TODO: Will provide help!'
        });
        break;
      case COMMANDS.FACE_WITH_URL:
        resolve({
          type: RESPONSE_TYPES.PHOTO,
          content: this.faceWithUrl(command.getParameters(), chatId) // TODO: Split somewhere else
        });
        break;
      case COMMANDS.ADD_FACE:
        resolve({
          type: RESPONSE_TYPES.TEXT,
          content: 'TODO: Will upload photo!'
        });
        break;
      case COMMANDS.FACE_SEARCH:
        resolve({
          type: RESPONSE_TYPES.PHOTO,
          content: this.faceWithSearch(command.getParameters(), chatId)
        });
      default:
        throw new Error(`Unknown command ${command.getType()}`);
      }
    });
  }

  faceWithUrl([face, url], chatId) {
    return swapper.fetchAndSwap(url, face, chatId);
  }

  faceWithSearch([face, query], chatId) {
    return swapper.searchAndSwap(query, face, chatId);
  }
}
