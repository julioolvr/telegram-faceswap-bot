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
}
