import Promise from 'bluebird';
import fs from 'fs';
import imagesClient from 'google-images';
import request from 'request';
import cv from 'opencv';
import images from 'images';

Promise.promisifyAll(fs);

const MAX_SIZE = 1000;

function proportionalSize({ width, height }) { // TODO: Maybe adjusting stepSize according to image size is better
  if (width <= MAX_SIZE && height <= MAX_SIZE) {
    return { width, height };
  }

  const ratio = width / height;

  if (width > height) {
    return { width: MAX_SIZE, height: MAX_SIZE / ratio };
  } else {
    return { height: MAX_SIZE, width: MAX_SIZE * ratio };
  }
}

export function load(backgroundPath, newFacePath) {
  return Promise.props({
    background: fs.readFileSync(backgroundPath),
    newFace: fs.readFileSync(newFacePath)
  });
}

export function swap({ background, newFace }) {
  return new Promise((resolve, reject) => {
    let backgroundStream = new cv.ImageDataStream();

    // TODO: Use these to have a reasonable size
    // let { width, height } = proportionalSize(backgroundImage);

    backgroundStream.on('load', matrix => {
      matrix.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
        if (err) {
          reject(err); // TODO: Better error messages
        } else {
          let image = images(matrix.toBuffer());
          faces.forEach(face => {
            let newFaceImage = images(newFace).size(face.width, face.height);
            image.draw(newFaceImage, face.x, face.y);
          });
          resolve(image.encode('png'));
        }
      });
    });

    background.pipe(backgroundStream);
  });
}

export function searchGoogleImages(query) {
  return Promise.fromNode(imagesClient.search.bind(imagesClient, query));
}

export function fetchAndSwap(url, newFacePath) {
  return swap({
    background: request({ url, encoding: null }),
    newFace: fs.readFileSync(newFacePath)
  });
}

export function searchAndSwap(query, newFacePath) {
  let backgroundPromise = searchGoogleImages(query).then(images => {
    if (images.length === 0) {
      throw new Error('No images found');
    }

    // TODO: Handle that maybe some URLs end up not being images
    return request({ url: images[0].url, encoding: null });
  });

  return Promise.props({
    background: backgroundPromise,
    newFace: fs.readFileSync(newFacePath)
  }).then(swap);
}

export function loadAndSwap(backgroundPath, newFacePath) {
  return load(backgroundPath, newFacePath).then(swap);
}
