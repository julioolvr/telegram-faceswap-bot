import request from 'request-promise';

export default class {
    constructor(token) {
      this.baseUrl = `https://api.telegram.org/bot${token}`;
    }

    sendText(text, chatId) {
      return request.post(`${this.baseUrl}/sendMessage`, { form: { text: text, chat_id: chatId } });
    }

    sendPhoto(image, chatId) {
      return image.then(function(buffer) {
        return request.post(`${this.baseUrl}/sendPhoto`, { formData: {
                                                            photo: {
                                                              value: buffer,
                                                              options: {
                                                                contentType: 'image/png',
                                                                filename: 'faceSwap.png'
                                                              }
                                                            }, chat_id: chatId } });
      }.bind(this));
    }

    getUpdates() {
      let options = { timeout: 60 };

      if (this.lastOffset !== undefined) {
        options.offset = this.lastOffset + 1;
      }

      return request.get({url: `${this.baseUrl}/getUpdates`, qs: options})
        .then(response => JSON.parse(response).result)
        .then(updates => {
          if (updates.length === 0) {
            return [];
          }

          let ids = updates.map(update => update.update_id);
          console.log(ids);
          this.lastOffset = Math.max(...ids);
          console.log('max id', this.lastOffset);
          return updates.map(update => update.message);
        });
    }
}
