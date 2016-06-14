import path from 'path'

function getRootPath() {
  return path.join(global.rootPath, 'img')
}

export const findFaceDirectory = (chatId) => {
  return path.join(getRootPath(), String(chatId))
}

export const findFacePath = (name, chatId) => {
  const faceDirectory = findFaceDirectory(chatId)
  const facePath = path.join(faceDirectory, `${name}.png`)

  if (facePath.indexOf(faceDirectory) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path')
  }

  return facePath
}
