import Promise from 'bluebird';
import Canvas from 'canvas';
import fs from 'fs';
import { tracking } from './tracking';
import imagesClient from 'google-images';
import request from 'request-promise';

const { Image } = Canvas;
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
    background: fs.readFileAsync(backgroundPath),
    newFace: fs.readFileAsync(newFacePath)
  });
}

export function swap({ background, newFace }) {
  return new Promise((resolve, reject) => {
    let canvas = new Canvas(200, 200);
    let ctx = canvas.getContext('2d');

    let backgroundImage = new Image();
    let newFaceImage = new Image();

    backgroundImage.src = background;
    newFaceImage.src = newFace;

    let tracker = new tracking.ObjectTracker(['face']);
    tracker.setStepSize(2.0);
    tracker.setEdgesDensity(0.1);
    tracker.setInitialScale(4.0);

    tracker.on('track', evt => {
      evt.data.forEach(data => {
        ctx.drawImage(newFaceImage, data.x, data.y, data.width, data.height);
      });

      resolve(canvas.pngStream());
    });

    let { width, height } = proportionalSize(backgroundImage);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(backgroundImage, 0, 0, width, height);

    // Calls canvas tracking directly instead of going through `document`
    tracking.trackCanvas_(canvas, tracker); // eslint-disable-line no-underscore-dangle
  });
}

export function searchGoogleImages(query) {
  return Promise.fromNode(imagesClient.search.bind(imagesClient, query));
}

export function fetchAndSwap(url, newFacePath) {
  return Promise.props({
    background: request({ url, encoding: null }),
    newFace: fs.readFileAsync(newFacePath)
  }).then(swap);
}

export function searchAndSwap(query, newFacePath) {
  let backgroundPromise = searchGoogleImages(query).then(images => {
    if (images.length === 0) {
      throw new Error('No images with faces found');
    }

    // TODO: Handle that maybe some URLs end up not being images
    return request({ url: images[0].url, encoding: null });
  });

  return Promise.props({
    background: backgroundPromise,
    newFace: fs.readFileAsync(newFacePath)
  }).then(swap);
}

export function loadAndSwap(backgroundPath, newFacePath) {
  return load(backgroundPath, newFacePath).then(swap);
}
