import config from './config';
import * as THREE from 'three';

// Change config
// config.pixelRatio = 1;
// config.antialias = false;

// Get canvas
const canvas = document.querySelector('#js-canvas') as HTMLCanvasElement;

// Prepare renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: config.antialias,
  powerPreference: 'high-performance'
});
renderer.setSize(
  Math.floor(canvas.clientWidth * config.pixelRatio),
  Math.floor(canvas.clientHeight * config.pixelRatio),
  false
);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(config.backgroundColor);

export default renderer;