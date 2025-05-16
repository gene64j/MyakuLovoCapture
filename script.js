import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert('カメラにアクセスできませんでした: ' + err.message);
  });

// Three.js初期化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const loader = new GLTFLoader();
let model;
loader.load('model.glb', (gltf) => {
  model = gltf.scene;
  scene.add(model);

  // モデルの大きさ・位置調整
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, size * 1.5)));
  camera.lookAt(center);
}, undefined, (err) => {
  console.error('GLB読み込みエラー:', err);
});

// videoのメタデータが読み込まれたらサイズ調整
video.addEventListener('loadedmetadata', () => {
  updateRendererSize();
});

window.addEventListener('resize', () => {
  updateRendererSize();
});

function updateRendererSize() {
  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;
  if (!vidWidth || !vidHeight) return;

  const vidRatio = vidWidth / vidHeight;

  // CSS上の表示サイズ（幅は画面幅に合わせて、高さは縦横比に基づいて計算）
  const cssWidth = window.innerWidth;
  const cssHeight = cssWidth / vidRatio;

  // CSSサイズ設定
  renderer.domElement.style.width = `${cssWidth}px`;
  renderer.domElement.style.height = `${cssHeight}px`;

  // 内部解像度は動画の元ピクセルサイズに設定
  renderer.setSize(vidWidth, vidHeight, false);

  // カメラのアスペクト比更新
  camera.aspect = vidRatio;
  camera.updateProjectionMatrix();

  // ボタンの位置調整（画面下から少し上に）
  const bottomOffset = window.innerHeight - cssHeight;
  captureBtn.style.bottom = `${bottomOffset + 20}px`;
}

captureBtn.addEventListener('click', () => {
  renderer.render(scene, camera);

  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;

  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = vidWidth;
  captureCanvas.height = vidHeight;
  const ctx = captureCanvas.getContext('2d');

  // videoの実映像を描画
  ctx.drawImage(video, 0, 0, vidWidth, vidHeight);

  // Three.jsキャンバスも同じサイズなので、重ねて描画
  ctx.drawImage(renderer.domElement, 0, 0, vidWidth, vidHeight);

  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'capture.jpg';
  link.click();
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
