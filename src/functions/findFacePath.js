import path from 'path';

function getRootPath() {
  return path.join(global.rootPath, 'img');
}

export default function(name, chatId) {
  let facePath = path.join(getRootPath(), String(chatId), `${name}.png`);

  if (facePath.indexOf(path.join(getRootPath(), String(chatId))) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path');
  }

  return facePath;
}
