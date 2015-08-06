import path from 'path';

const faceRootPath = path.join(global.rootPath, 'img');

export default function(name, chatId) {
  let facePath = path.join(faceRootPath, `${chatId}`, `${name}.png`);

  if (facePath.indexOf(faceRootPath) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path');
  }

  return facePath;
}
