import path from 'path';

const faceRootPath = path.join(path.dirname(require.main.filename), 'img');

export default function(name, chatId) {
  let facePath = path.join(faceRootPath, `${chatId}`, `${name}.png`);

  if (facePath.indexOf(faceRootPath) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path');
  }

  return facePath;
}
