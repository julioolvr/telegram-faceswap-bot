// Nodeunit-sandbox-wrapper (?) for tracking.js

import { utils } from 'nodeunit';
const context = {
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  Int8Array: Int8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Uint32Array: Uint32Array,
  navigator: {},
  tracking: {},
  window: {}
};

export const tracking = utils.sandbox([
  'node_modules/tracking/build/tracking.js',
  'node_modules/tracking/build/data/face.js'
], context).tracking; // TODO: Avoid referencing node_modules
