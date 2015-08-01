import Promise from 'bluebird';
import Canvas from 'canvas';
import fs from 'fs';
import { tracking } from './tracking';

const { Image } = Canvas;

Promise.promisifyAll(fs);

export function load(backgroundPath, newFacePath) {
  return Promise.props({
    background: fs.readFileAsync(backgroundPath),
    newFace: fs.readFileAsync(newFacePath)
  });
}

export function swap({ background, newFace }) {
  let canvas = new Canvas(200, 200);
  let ctx = canvas.getContext('2d');

  let backgroundImage = new Image();
  let newFaceImage = new Image();


  backgroundImage.src = background;
  newFaceImage.src = newFace;

  canvas.width = backgroundImage.width;
  canvas.height = backgroundImage.height;
  ctx.drawImage(backgroundImage, 0, 0);

  /* Check all of this as it is copy-pasted */
  let tracker = new tracking.ObjectTracker(['face']);
  tracker.setStepSize(1.7);
  tracker.on('track', evt => {
    evt.data.forEach(data => {
      ctx.drawImage(newFaceImage, data.x, data.y, data.width, data.height);
    });

    let stream = canvas.pngStream();
    let output = fs.createWriteStream('./test.png');

    stream.on('data', chunk => {
      output.write(chunk);
    });

    stream.on('end', () => {
      console.log('Finished saving test.png');
    });
  });

  tracking.trackCanvas_(canvas, tracker); // eslint-disable-line no-underscore-dangle
}

export function loadAndSwap(backgroundPath, newFacePath) {
  return load(backgroundPath, newFacePath).then(swap);
}
