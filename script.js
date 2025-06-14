import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');
const canvas = document.getElementById('three-canvas');
const snapshot = document.getElementById('snapshot');
const captureButton = document.getElementById('capture-button');
const downloadButton = document.getElementById('download-btn');
const deleteButton = document.getElementById('delete-btn');

video.width = window.innerWidth;
video.height = window.innerHeight;
let videoWidth = 0, videoHeight = 0;
let lastImageURL = null;

// カメラ取得
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      videoWidth = video.videoWidth;
      videoHeight = video.videoHeight;
    };
  } catch (e) {
    console.error("カメラ起動エラー:", e);
  }
}

// Three.js初期化
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
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
  renderer.setPixelRatio(window.devicePixelRatio); // 画質向上
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  console.log('resize', width, height);
}
window.addEventListener('resize', resize);
resize();

let lastRenderWidth = 0;
let lastRenderHeight = 0;

// アニメーション
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  lastRenderWidth = renderer.domElement.width;
  lastRenderHeight = renderer.domElement.height;
}
animate();

// 📸 撮影処理（video + 3Dを合成して保存）
function capture() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenAspect = screenWidth / screenHeight;
  const videoAspect = videoWidth / videoHeight;

  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = screenWidth;
  captureCanvas.height = screenHeight;
  const ctx = captureCanvas.getContext('2d');

  let sx, sy, sWidth, sHeight;
  if (screenAspect > videoAspect) {
    sWidth = videoWidth;
    sHeight = videoWidth / screenAspect;
    sx = 0;
    sy = (videoHeight - sHeight) / 2;
  } else {
    sHeight = videoHeight;
    sWidth = videoHeight * screenAspect;
    sy = 0;
    sx = (videoWidth - sWidth) / 2;
  }

  // videoを画面に表示されているサイズで描画
  ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, screenWidth, screenHeight);

  // WebGL canvasの内容を同じサイズで合成
  const renderWidth = renderer.domElement.width;
  const renderHeight = renderer.domElement.height;
  const renderAspect = renderWidth / renderHeight;
  if (screenAspect > renderAspect) {
    sWidth = renderWidth;
    sHeight = renderWidth / screenAspect;
    sx = 0;
    sy = (renderHeight - sHeight) / 2;
  } else {
    sHeight = renderHeight;
    sWidth = renderHeight * screenAspect;
    sy = 0;
    sx = (renderWidth - sWidth) / 2;
  }

  renderer.render(scene, camera); // ← これ重要
  ctx.drawImage(renderer.domElement, sx, sy, sWidth, sHeight, 0, 0, screenWidth, screenHeight);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 300,300);
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText(`canvas: ${canvas.width} x ${canvas.height}`, 20, 40);
  ctx.fillText(`video: ${videoWidth} x ${videoHeight}`, 20, 70);
  ctx.fillText(`screen: ${screenWidth} x ${screenHeight}`, 20, 100);
  ctx.fillText(`aspect: ${screenAspect} x ${videoAspect}`, 20, 130); 
  ctx.fillText(`sx: ${sx} sy: ${sy}`, 20, 160);
  ctx.fillText(`sWidth: ${sWidth} sHeight: ${sHeight}`, 20, 190);
  ctx.fillText(`last render: ${lastRenderWidth} x ${lastRenderHeight}`, 20, 220);

  // 保存処理（JPEG）
  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
  snapshot.src = dataURL;
  snapshot.style.display = 'block';
  video.style.display = 'none';
  lastImageURL = dataURL;

  downloadButton.style.display = 'flex';
  deleteButton.style.display = 'flex';
  captureButton.style.display = 'none';
}

captureButton.addEventListener('click', capture);

function resetControls() {
  snapshot.style.display = 'none';
  video.style.display = 'block';
  lastImageURL = null;
  // buttons
  downloadButton.style.display = 'none';
  deleteButton.style.display = 'none';
  captureButton.style.display = 'flex';
}

downloadButton.addEventListener('click', () => {
  if (lastImageURL) {
    const link = document.createElement('a');
    link.href = lastImageURL;
    link.download = 'capture.jpg';
    link.click();
  }
  resetControls();
});

deleteButton.addEventListener('click', resetControls);

startCamera();