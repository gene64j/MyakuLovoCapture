import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');

// カメラ映像取得
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert('カメラにアクセスできませんでした: ' + err.message);
  });

// Three.jsのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0); // 背景透明
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100vw';
renderer.domElement.style.height = '100vh';
renderer.domElement.style.zIndex = '1';
renderer.domElement.style.pointerEvents = 'none'; // 操作は透過
document.body.appendChild(renderer.domElement);

// ライトとコントロール
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // モデル位置とカメラ調整
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

// 📸 撮影処理
captureBtn.addEventListener('click', () => {
  renderer.render(scene, camera); // 直近描画を確定

  const modelImage = new Image();
  modelImage.src = renderer.domElement.toDataURL('image/png');

  modelImage.onload = () => {
    // videoの実際の映像サイズ（ピクセル）
    const vidWidth = video.videoWidth;
    const vidHeight = video.videoHeight;

    // captureCanvasはvideoの実映像サイズで作成
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = vidWidth;
    captureCanvas.height = vidHeight;
    const ctx = captureCanvas.getContext('2d');

    // videoの実映像をキャンバスに描画
    ctx.drawImage(video, 0, 0, vidWidth, vidHeight);

    // modelImageをvideo映像サイズに合わせて描画
    // modelImageはrenderer.domElementのサイズと異なるかもしれないため注意
    ctx.drawImage(modelImage, 0, 0, vidWidth, vidHeight);

    const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'capture.jpg';
    link.click();
  };
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
