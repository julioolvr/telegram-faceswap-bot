import TelegramBot from 'node-telegram-bot-api';
import got from 'got';
import Promise from 'bluebird';
import fs from 'fs';

import Command from './command';
import { COMMANDS } from './command';
import * as swapper from './swapper';
import { findFaceDirectory, findFacePath } from './functions/findFacePath';

Promise.promisifyAll(fs);

const RESPONSE_TYPES = {
  TEXT: 'TEXT',
  PHOTO: 'PHOTO',
  FORCE_REPLY: 'FORCE_REPLY'
};

const REPLY_TYPES = {
  FACE_NAME: 'FACE_NAME',
  ADD_FACE: 'ADD_FACE'
};

/**
 * @class Bot to respond to messages from Telegram users.
 */
export default class {
  /**
   * @param {string} token Telegram token for the bot.
   */
  constructor(token) {
    this.client = new TelegramBot(token, { polling: true });
    this.onMessageCallbacks = [];

    this.client.on('message', (msg) => {
      this.onMessageCallbacks.forEach(callback => callback(msg));
    });
  }

  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
  }

  /**
   * Responds to a given command from Telegram.
   * @param  {object} message         A message from Telegram.
   * @param  {string} message.text    It should be a command in the form of `/command <param1> <param2>`
   * @param  {number} message.chat.id Id of the chat to respond to.
   * @return {Promise|undefined}      A promise that won't resolve to anything useful yet. `undefined` if the message
   *                                  is not a command.
   */
  respondTo(message, replies) {
    let command = new Command(message);
    let responsePromise;

    if (command.isValid()) {
      responsePromise = this.respondToCommand(command, message.chat.id);
    } else if (replies) {
      responsePromise = this.replyTo(message, replies[0], replies.slice(1));
    } else {
      return;
    }

    return responsePromise.then(commandResponse => {
      // TODO: Make this promise resolve to something useful, or at a useful moment, like when the request to Telegram has
      // succeeded.
      switch (commandResponse.type) {
      case RESPONSE_TYPES.TEXT:
        this.client.sendMessage(message.chat.id, commandResponse.content);
        break;
      case RESPONSE_TYPES.PHOTO:
        commandResponse.content.then(buffer => this.client.sendPhoto(message.chat.id, buffer));
        break;
      case RESPONSE_TYPES.FORCE_REPLY:
        this.client.sendMessage(message.chat.id, commandResponse.content, {
          reply_markup: JSON.stringify({ force_reply: true })
        }).then(sent => {
          this.client.onReplyToMessage(sent.chat.id, sent.message_id, (reply) => {
            commandResponse.originalMessage = message;
            this.respondTo(reply, [commandResponse].concat(replies || []));
          });
        });
        break;
      }
    }).catch(err => {
      console.log('No response available for message "%s", error: %s', message.text, err.stack);
      throw err;
    });
  }

  replyTo(message, lastReply, otherReplies) {
    return new Promise((resolve, reject) => {
      switch(lastReply.replyType) {
      case REPLY_TYPES.FACE_NAME:
        fs.mkdirAsync(findFaceDirectory(message.chat.id))
          .catch(() => {})
          .then(() => this.client.getFileLink(lastReply.originalMessage.document.file_id))
          .then(fileLink => {
            got
              .stream(fileLink, { encoding: null })
              .pipe(fs.createWriteStream(findFacePath(message.text, message.chat.id)));
          })
          .then(() => {
            resolve({
              type: RESPONSE_TYPES.TEXT,
              content: `Got it! Name was ${message.text}`
            });
          });
        break;
      case REPLY_TYPES.ADD_FACE:
        resolve({
          type: RESPONSE_TYPES.FORCE_REPLY,
          content: 'Got it! Now tell me the name for the face',
          replyType: REPLY_TYPES.FACE_NAME
        });
        break;
      default:
        reject(`Unknown reply type ${lastReply.type}`);
      }
    });
  }

  /**
   * Returns a response object for the given {Command} to the given chat id.
   *
   * @param  {Command} command
   * @param  {number} chatId
   * @return {Promise} Promise that resolves with the type of the response and its content,
   *                   or is rejected if no valid command is found.
   */
  respondToCommand(command, chatId) {
    return new Promise((resolve, reject) => {
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
          content: this.faceWithUrl(command.getParameters(), chatId)
        });
        break;
      case COMMANDS.ADD_FACE:
        resolve({
          type: RESPONSE_TYPES.FORCE_REPLY,
          content: 'Send me the image of the face AS A FILE! Otherwise you\'ll lose the transparency',
          replyType: REPLY_TYPES.ADD_FACE
        });
      case COMMANDS.SEND_FACE:
        resolve({
          type: RESPONSE_TYPES.FORCE_REPLY,
          content: 'What\'s the name of the new face?',
          replyType: REPLY_TYPES.FACE_NAME
        });
        break;
      case COMMANDS.FACE_SEARCH:
        resolve({
          type: RESPONSE_TYPES.PHOTO,
          content: this.faceWithSearch(command.getParameters(), chatId)
        });
      default:
        reject(`Unknown command ${command.getType()}`);
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
