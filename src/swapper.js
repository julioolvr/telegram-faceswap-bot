import Promise from 'bluebird';
import fs from 'fs';
import * as googleImages from './services/googleImages';
import request from 'request';
import cv from 'opencv';
import images from 'images';
import { findFacePath } from './functions/findFacePath';

const MAX_SIZE = 1000;

function proportionalSize(width, height) {
  if (width <= MAX_SIZE && height <= MAX_SIZE) {
    return 1;
  }

  if (width > height) {
    return MAX_SIZE / width;
  } else {
    return MAX_SIZE / height;
  }
}

export function swap({ background, newFace }) {
  return new Promise((resolve, reject) => {
    let backgroundStream = new cv.ImageDataStream();

    backgroundStream.on('load', matrix => {
      let image = images(matrix.toBuffer());
      let resizeRatio = proportionalSize(image.width(), image.height());
      image.resize(image.width() * resizeRatio, image.height() * resizeRatio);

      matrix.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
        if (err) {
          reject(err); // TODO: Better error messages
        } else if (faces.length === 0) {
          reject('Couldn\'t find any face on that image');
        } else {
          faces.forEach(face => {
            let newFaceImage = images(newFace).size(face.width * resizeRatio, face.height * resizeRatio);
            image.draw(newFaceImage, face.x * resizeRatio, face.y * resizeRatio);
          });

          resolve(image.encode('png'));
        }
      });
    });

    background.pipe(backgroundStream);
  });
}

export function fetchAndSwap(url, newFaceName, chatId) {
  return swap({
    background: request({ url, encoding: null }),
    newFace: fs.readFileSync(findFacePath(newFaceName, chatId))
  });
}

export function searchAndSwap(query, newFaceName, chatId) {
  return googleImages.search(query).then(imagesUrls => {
    if (imagesUrls.length === 0) {
      throw new Error('No images found');
    }

    return multipleFetchAndSwap(imagesUrls, newFaceName, chatId);
  });
}

function multipleFetchAndSwap(urls, newFaceName, chatId) {
  return new Promise((resolve, reject) => {
    if (urls.length === 0) {
      reject('No face found on any url');
    } else {
      resolve(fetchAndSwap(urls[0], newFaceName, chatId).catch(err => {
        return multipleFetchAndSwap(urls.slice(1), newFaceName, chatId);
      }));
    }
  });
}
