import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';

import path from 'path';

import findFacePath from '../../src/functions/findFacePath';

describe('findFacePath', () => {
  const rootPath = path.join('some', 'root', 'path');

  beforeEach(() => {
    global.rootPath = rootPath;
  });

  afterEach(() => {
    delete global.rootPath;
  });

  it('builds a path for the face image for a specific chat id', () => {
    const faceName = 'faceName';
    const chatId = '12345';

    expect(findFacePath(faceName, chatId)).to.match(new RegExp(`/img/${path.join(chatId, faceName)}.png$`));
  });

  it('throws an error when trying to access an image from outside the root path', () => {
    const faceName = '../../faceName';
    const chatId = '12345';

    expect(() => findFacePath(faceName, chatId)).to.throw(Error);
  });

  it('throws an error when trying to access an image from outside the given chat directory', () => {
    const faceName = '../faceName';
    const chatId = '12345';

    expect(() => findFacePath(faceName, chatId)).to.throw(Error);
  });
});
