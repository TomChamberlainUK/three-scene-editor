import './styles.css';
import config from './config';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { Pane, FolderApi } from 'tweakpane';

import renderer from './renderer';
import infiniteGridHelper from 'helpers/infiniteGridHelper';



// Prepare scene
const scene = new THREE.Scene();




// Prepare camera
const camera = new THREE.PerspectiveCamera(75, renderer.domElement.width / renderer.domElement.height, 0.01, 1000);
camera.position.x = 5;
camera.position.y = 3;
camera.position.z = 5;
camera.layers.enable(31);




// Add infinite grid helper
scene.add(infiniteGridHelper);




// Prepare lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-15, 50, -35);
scene.add(directionalLight);




// Add some simple geometry
for (let i = 0; i < 10; i++) {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial()
  );
  cube.position.set(
    (Math.random() * 20) - 10,
    0,
    (Math.random() * 20) - 10
  );
  cube.layers.enable(1);
  scene.add(cube);
}


// Prepare controls
// Transform controls to make live transformations to objects
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(0.8);
transformControls.layers.set(31);
transformControls.traverse((obj) => { // To be detected correctly by OutlinePass.
  // @ts-ignore
  obj.isTransformControls = true;
});
scene.add(transformControls);

// Change transformation mode on keys
window.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'w':
      transformControls.setMode('translate');
      break;
    case 'e':
      transformControls.setMode('rotate');
      break;
    case 'r':
      transformControls.setMode('scale');
      break;
  }
});

// Disable orbit controls while using transform controls
transformControls.addEventListener('dragging-changed', function(event) {
  orbitControls.enabled = !event.value;
});

// Orbit control for camera rotation
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;





// Post-Processing
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(new THREE.Vector2(renderer.domElement.width, renderer.domElement.height), scene, camera);
composer.addPass(outlinePass);
outlinePass.selectedObjects = [];
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0xffffff);
outlinePass.edgeStrength = 5;




// Controls

// Mouse picking controls
const mouse = new THREE.Vector2();
let mouseTargetObject: any = null;
const raycaster = new THREE.Raycaster();
raycaster.layers.set(1);

// Calculate mouse position in normalized device coordinates
// (-1 to +1) for both components
function handleMouseMove(event: MouseEvent) {
  mouse.x = 2 * (event.clientX / renderer.domElement.clientWidth) - 1;
  mouse.y = 1 - 2 * (event.clientY / renderer.domElement.clientHeight);

  checkIntersection();
  setHoveredObject(mouseTargetObject);
}

function checkIntersection() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  let selectedObject = null;

  if (intersects.length > 0) {
    intersects.sort((a, b) => a.distance - b.distance);
    selectedObject = intersects[0].object;
  }

  mouseTargetObject = selectedObject;

}

function setHoveredObject(object: any) {
  outlinePass.selectedObjects = object ? [object] : [];
}

function handleMouseClick(event: MouseEvent) {

  if (!allowMouseClick) return;

  if (mouseTargetObject) {
    transformControls.attach(mouseTargetObject);

    
    const object = scene.getObjectById(mouseTargetObject.id);

    console.log(object)

    const PARAMS = {
      positionX: object.position.x,
      positionY: object.position.y,
      positionZ: object.position.z,
      scaleX: object.scale.x,
      scaleY: object.scale.y,
      scaleZ: object.scale.z,
      rotationX: object.rotation.x,
      rotationY: object.rotation.y,
      rotationZ: object.rotation.z,

      // @ts-ignore
      color: object.material.color.getHex()
    }

    if (objectPane) objectPane.dispose();
    objectPane = pane.addFolder({ title: 'Object' });

    const transformPane = objectPane.addFolder({ title: 'Transform' });
    
    const positionPane = transformPane.addFolder({ title: 'Position' });
    positionPane.addInput(PARAMS, 'positionX', { label: 'x' }).on('change', () =>  object.position.x = PARAMS.positionX);
    positionPane.addInput(PARAMS, 'positionY', { label: 'y' }).on('change', () =>  object.position.y = PARAMS.positionY);
    positionPane.addInput(PARAMS, 'positionZ', { label: 'z' }).on('change', () =>  object.position.z = PARAMS.positionZ);

    const scalePane = transformPane.addFolder({ title: 'Scale' });
    scalePane.addInput(PARAMS, 'scaleX', { label: 'x' }).on('change', () =>  object.scale.x = PARAMS.scaleX);
    scalePane.addInput(PARAMS, 'scaleY', { label: 'y' }).on('change', () =>  object.scale.y = PARAMS.scaleY);
    scalePane.addInput(PARAMS, 'scaleZ', { label: 'z' }).on('change', () =>  object.scale.z = PARAMS.scaleZ);
    
    const rotationPane = transformPane.addFolder({ title: 'Rotation' });
    rotationPane.addInput(PARAMS, 'rotationX', { label: 'x' }).on('change', () =>  object.rotation.x = PARAMS.rotationX);
    rotationPane.addInput(PARAMS, 'rotationY', { label: 'y' }).on('change', () =>  object.rotation.y = PARAMS.rotationY);
    rotationPane.addInput(PARAMS, 'rotationZ', { label: 'z' }).on('change', () =>  object.rotation.z = PARAMS.rotationZ);


    const materialPane = objectPane.addFolder({ title: 'Material' });
    
    // @ts-ignore
    materialPane.addInput(PARAMS, 'color', { label: 'Color', view: 'color' }).on('change', () => object.material.color.setHex(PARAMS.color));

  } else {
    transformControls.detach();

    objectPane.dispose();

  }
}


// Events to check if click has been held to prevent drag clicks
let allowMouseClick = true;
let mouseDownTime: number;
let mouseUpTime: number;

function handleMouseDown() {
  mouseDownTime = performance.now()
}

function handleMouseUp() {
  mouseUpTime = performance.now();
  const elapsedTime = mouseUpTime - mouseDownTime;
  allowMouseClick = elapsedTime < 250;
}

window.addEventListener('mousemove', handleMouseMove, false);
renderer.domElement.addEventListener('mousedown', handleMouseDown, false);
renderer.domElement.addEventListener('mouseup', handleMouseUp, false);
renderer.domElement.addEventListener('click', handleMouseClick, false);



// Add stats
// @ts-ignore
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


// Animation loop
function render() {
  requestAnimationFrame(render);
  stats.begin();
  resizeCanvasToDisplaySize();
  orbitControls.update();
  // renderer.render(scene, camera);
  composer.render();
  stats.end();
}




// TESTING TWEAKPANE
const PARAMS = {
  background: config.backgroundColor
}

const pane = new Pane();

pane.addInput(PARAMS, 'background', { view: 'color' }).on('change', () => renderer.setClearColor(PARAMS.background));

let objectPane: FolderApi;

render();


// Utilities
function resizeCanvasToDisplaySize() {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(
      Math.floor(width * config.pixelRatio),
      Math.floor(height * config.pixelRatio),
      false
    );
  }
}