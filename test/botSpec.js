import { describe, it, beforeEach, afterEach } from 'mocha';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';

const { spy } = sinon;
const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

import * as swapper from '../src/swapper';

let telegramBotStub = {
  sendMessage: spy(),
  sendPhoto: spy(),
  on: spy()
};

const Bot = proxyquire('../src/bot', { 'node-telegram-bot-api': () => telegramBotStub });

describe('Bot', () => {
  const bot = new Bot();

  describe('#respondTo', () => {
    it('returns immediately if the message is not a command', () => {
      expect(bot.respondTo({ text: 'oh hai' })).to.be.undefined;
    });

    it('returns a failing promise if the command is not supported', () => {
      expect(bot.respondTo({ text: '/unknownCommand', chat: {} })).to.be.rejected;
    });

    describe('commands', () => {
      const chatId = 12345;

      describe('/start', () => {
        it('sends a text message', () => {
          return bot.respondTo({ text: '/start', chat: { id: chatId } }).then(() => {
            expect(telegramBotStub.sendMessage).to.have.been.calledWith(chatId, sinon.match.string);
          });
        });
      });

      describe('/faceWithUrl', () => {
        const faceName = 'someone';
        const url = 'http://example.com/image.png';

        beforeEach(() => {
          sinon.stub(swapper, 'fetchAndSwap').returns({ then: spy() });
        });

        afterEach(() => {
          swapper.fetchAndSwap.restore();
        });

        it('uses the swapper with the provided face name and URL', () => {
          return bot.respondTo({ text: `/faceWithUrl ${faceName}+${url}`, chat: { id: chatId } }).then(() => {
            expect(swapper.fetchAndSwap).to.have.been.calledWith(url, faceName, chatId);
          });
        });

        it('sends a photo', () => {
          const buffer = {};
          const bufferPromise = { then: (cb) => cb(buffer) };
          swapper.fetchAndSwap.returns(bufferPromise);

          return bot.respondTo({ text: `/faceWithUrl ${faceName}+${url}`, chat: { id: chatId } }).then(() => {
            expect(telegramBotStub.sendPhoto).to.have.been.calledWith(chatId, buffer);
          });
        });
      });
    });
  });
});
