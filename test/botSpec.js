import { describe, it, beforeEach, afterEach } from 'mocha';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

const { spy } = sinon;
const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

import * as swapper from '../src/swapper';
import Bot from '../src/bot';

describe('Bot', () => {
  const telegramClient = {
    sendText: spy(),
    sendPhoto: spy()
  };
  const bot = new Bot({ client: telegramClient });

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
            expect(telegramClient.sendText).to.have.been.calledWith(sinon.match.string, chatId);
          });
        });
      });

      describe('/faceWithUrl', () => {
        const faceName = 'someone';
        const url = 'http://example.com/image.png';

        beforeEach(() => {
          sinon.stub(swapper, 'fetchAndSwap');
        });
        afterEach(() => {
          swapper.fetchAndSwap.restore();
        });

        it('uses the swapper with the provided face name and URL', () => {
          return bot.respondTo({ text: `/faceWithUrl ${faceName} ${url}`, chat: { id: chatId } }).then(() => {
            expect(swapper.fetchAndSwap).to.have.been.calledWith(url, faceName, chatId);
          });
        });

        it('sends a photo', () => {
          const bufferPromise = {};
          swapper.fetchAndSwap.returns(bufferPromise);

          return bot.respondTo({ text: `/faceWithUrl ${faceName} ${url}`, chat: { id: chatId } }).then(() => {
            expect(telegramClient.sendPhoto).to.have.been.calledWith(bufferPromise, chatId);
          });
        });
      });
    });
  });
});
