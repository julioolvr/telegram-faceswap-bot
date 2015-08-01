import request from 'request-promise';
import fs from 'fs';

export default class {
    constructor(token) {
      this.baseUrl = `https://api.telegram.org/bot${token}`;
    }

    sendPhoto(buffer, chatId) {
      return request.post(`${this.baseUrl}/sendPhoto`, { formData: {
                                                          photo: {
                                                            value: buffer,
                                                            options: {
                                                              contentType: 'image/png',
                                                              filename: 'faceSwap.png'
                                                            }
                                                          }, chat_id: chatId } });
    }
}
