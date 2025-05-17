import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');
const canvas = document.getElementById('three-canvas');

// カメラ取得
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  .then(stream => {
    video.srcObject = stream;
  }).catch(err => {
    alert('カメラにアクセスできません: ' + err.message);
  });

// Three.js初期化
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 33);
scene.add(light);

let model;
const loader = new GLTFLoader();
loader.load('model.glb', gltf => {
  model = gltf.scene;
  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();

  camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, size * 1.5)));
  controls.target.copy(center);
  camera.lookAt(center);
}, undefined, err => {
  console.error('モデル読み込みエラー:', err);
});

// リサイズ対応
function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// アニメーション
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// 撮影処理
document.getElementById('captureBtn').addEventListener('click', () => {
  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = renderer.domElement.width;
  captureCanvas.height = renderer.domElement.height;
  const ctx = captureCanvas.getContext('2d');

  // videoを合成
  ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

  // モデル（WebGL）を合成
  ctx.drawImage(renderer.domElement, 0, 0, captureCanvas.width, captureCanvas.height);

  // JPGで保存
  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'capture.jpg';
  link.click();
});
