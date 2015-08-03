import Promise from 'bluebird';
import fs from 'fs';
import imagesClient from 'google-images';
import request from 'request';
import cv from 'opencv';
import images from 'images';

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
  let backgroundPromise = searchGoogleImages(query).then(googleImages => {
    if (googleImages.length === 0) {
      throw new Error('No images found');
    }

    // TODO: Handle that maybe some URLs end up not being images
    return request({ url: googleImages[0].url, encoding: null });
  });

  return Promise.props({
    background: backgroundPromise,
    newFace: fs.readFileSync(newFacePath)
  }).then(swap);
}
