import TelegramBot from 'node-telegram-bot-api';
import got from 'got';
import Promise from 'bluebird';
import fs from 'fs';

import MessagesFsm from './messagesFsm';
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

  async respondTo(message) {
    const fsm = new MessagesFsm(this.client);
    fsm.addMessage(message);

    while (fsm.isWaitingForReply()) {
      let userReply = await fsm.onReplyReceived();
      fsm.addMessage(userReply);
    }
  }
}
