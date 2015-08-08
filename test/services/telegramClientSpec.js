import { describe, it, beforeEach, afterEach } from 'mocha';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

const { spy } = sinon;
const { expect } = chai;
chai.use(sinonChai);

import request from 'request-promise';
import TelegramClient from '../../src/services/telegramClient';

describe('TelegramClient', () => {
  const chatId = 1234;
  const botToken = '123456abcdef';
  let client;

  beforeEach('Stubbing request-promise', () => {
    client = new TelegramClient(botToken);
    sinon.stub(request, 'get');
    sinon.stub(request, 'post');
  });

  afterEach('Clearing request-promise stubs', () => {
    request.get.restore();
    request.post.restore();
  });

  describe('constructtor', () => {
    it('builds the base url using the bot token', () => {
      expect(client.baseUrl).to.match(new RegExp(`${botToken}$`));
    });
  });

  describe('#sendText', () => {
    const message = 'hey!';

    it('uses the /sendMessage endpoint', () => {
      client.sendText(message, chatId);
      expect(request.post).to.have.been.calledWith(
        sinon.match(/\/sendMessage$/),
        sinon.match({ form: { text: message, chat_id: chatId } })
      );
    });
  });

  describe('#sendPhoto', () => {
    const buffer = [];
    const imagePromise = {
      then: (cb) => cb(buffer)
    };

    it('uses the /sendPhoto endpoint and sends the buffer through a form', () => {
      client.sendPhoto(imagePromise, chatId);
      expect(request.post).to.have.been.calledWith(
        sinon.match(/\/sendPhoto$/),
        sinon.match({ formData: {
          photo: {
            value: buffer,
            options: {
              contentType: 'image/png',
              filename: sinon.match(/\.png$/)
            },
          },
          chat_id: chatId
        }})
      );
    });
  });

  describe('#getUpdates', () => {
    let responseStub = {};
    function getResponseStub() {
      return JSON.stringify(responseStub);
    }

    const responsePromise = {
      then: (responseCb) => {
        return { then: (resultCb) => resultCb(responseCb(getResponseStub())) };
      }
    };

    beforeEach('set request.get stubbed response', () => {
      request.get.returns(responsePromise);
    });

    describe('with no updates', () => {
      beforeEach(() => {
        responseStub.result = [];
      });

      it('resolves with an empty array', () => {
        expect(client.getUpdates()).to.be.empty;
      });
    });

    describe('with updates', () => {
      const message = {};
      const update = { message, update_id: 1 };
      beforeEach(() => {
        responseStub.result = [update];
      });

      it('returns the messages from the udpates', () => {
        expect(client.getUpdates()).to.contain(message);
      });

      it('uses the last id as offset for the subsequent request', () => {
        client.getUpdates();
        client.getUpdates();
        expect(request.get).to.have.been.calledWith(sinon.match({ qs: { offset: update.update_id + 1 } }));
      });
    });
  });
});
