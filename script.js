import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');

// カメラ映像の取得
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert('カメラにアクセスできませんでした: ' + err.message);
  });

// Three.js 初期化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// モデルの読み込み
const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // 中心・スケーリング調整
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, size * 1.5)));
  camera.lookAt(center);
}, undefined, (err) => {
  console.error('モデル読み込みエラー:', err);
});

// リサイズ対応
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 撮影ボタン
document.getElementById('captureBtn').addEventListener('click', () => {
  // まず、Three.jsの描画を1フレーム強制
  renderer.render(scene, camera);

  // 合成用キャンバス作成
  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = window.innerWidth;
  captureCanvas.height = window.innerHeight;
  const ctx = captureCanvas.getContext('2d');

  // videoを描画（カメラ映像）
  ctx.drawImage(video, 0, 0, captureCanvas.width, Math.floor(window.innerHeight * 0.85));

  // Three.jsのcanvasを合成（3Dモデル）
  ctx.drawImage(renderer.domElement, 0, 0, captureCanvas.width, captureCanvas.height);

  // JPEG形式で保存
  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95); // 圧縮率95%

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'capture.jpg';
  link.click();
});

// 描画ループ
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
