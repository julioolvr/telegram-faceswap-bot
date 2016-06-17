import Promise from 'bluebird'
import fs from 'fs'
import request from 'request'
import cv from 'opencv'
import images from 'images'

import * as googleImages from './services/googleImages'
import { findFacePath, findFaceDirectory, allFaceNames} from './functions/findFacePath'
import { shuffleArray } from './functions/utils'

Promise.promisifyAll(fs)

const MAX_SIZE = 1000

function proportionalSize(width, height) {
  if (width <= MAX_SIZE && height <= MAX_SIZE) {
    return 1
  }

  if (width > height) {
    return MAX_SIZE / width
  } else {
    return MAX_SIZE / height
  }
}

export function swap({ background, newFaces }) {
  return new Promise((resolve, reject) => {
    let backgroundStream = new cv.ImageDataStream()

    backgroundStream.on('load', matrix => {
      let image = images(matrix.toBuffer())
      let resizeRatio = proportionalSize(image.width(), image.height())
      image.resize(image.width() * resizeRatio, image.height() * resizeRatio)

      matrix.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
        if (err) {
          reject(err) // TODO: Better error messages
        } else if (faces.length === 0) {
          reject(new Error('Couldn\'t find any face on that image'))
        } else {
          faces.forEach((face, i) => {
            let newFaceImage = images(newFaces[i % newFaces.length]).size(face.width * resizeRatio, face.height * resizeRatio)
            image.draw(newFaceImage, face.x * resizeRatio, face.y * resizeRatio)
          })

          resolve(image.encode('png'))
        }
      })
    })

    background.pipe(backgroundStream)
  })
}

export async function fetchAndSwap(url, faces, chatId) {
  let faceNames = faces

  if (!faceNames) {
    let allFaces = await allFaceNames(chatId)
    faceNames = shuffleArray(allFaces)
  }

  return swap({
    background: request({ url, encoding: null }),
    newFaces: faceNames.map(faceName => fs.readFileSync(findFacePath(faceName, chatId)))
  })
}

export function searchAndSwap(query, faces, chatId) {
  return googleImages.search(query).then(imagesUrls => {
    if (imagesUrls.length === 0) {
      throw new Error(`No images found for "${query}"`)
    }

    return multipleFetchAndSwap(shuffleArray(imagesUrls), faces, chatId).catch(err => {
      throw new Error(`No faces found on any image for "${query}"`)
    })
  })
}

async function multipleFetchAndSwap(urls, faces, chatId) {
  let swappedFace

  for (let i = 0; i < urls.length; i++) {
    try {
      swappedFace = await fetchAndSwap(urls[i], faces, chatId)
    } catch (err) {
      console.log('Error finding face', urls[i], err)
    }

    if (swappedFace) {
      return swappedFace
    }
  }

  throw new Error('No face found on any url')
}
