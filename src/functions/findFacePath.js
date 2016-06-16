import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'

Promise.promisifyAll(fs)

function getRootPath() {
  return path.join(global.rootPath, 'img')
}

export const findFaceDirectory = (chatId) => {
  return path.join(getRootPath(), String(chatId))
}

export const findFacePath = (name, chatId) => {
  const faceDirectory = findFaceDirectory(chatId)
  const facePath = path.join(faceDirectory, `${name.toLowerCase()}.png`)

  if (facePath.indexOf(faceDirectory) !== 0) {
    throw new Error('Tried to access a face outside the chat\'s path')
  }

  return facePath
}

export async function allFaceNames(chatId) {
  const fileNames = await fs.readdirAsync(findFaceDirectory(chatId))
  return fileNames
    .filter(fileName => fileName.endsWith('.png'))
    .map(imageFileName => imageFileName.replace(/\.png$/, ''))
    .map(faceName => faceName.toLowerCase())
}
