import path from 'path';

function getRootPath() {
  return path.join(global.rootPath, 'img');
}

export default function(name, chatId) {
  let facePath = path.join(getRootPath(), chatId, `${name}.png`);

  console.log('got facepath', facePath);
  if (facePath.indexOf(path.join(getRootPath(), chatId)) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path');
  }

  return facePath;
}
