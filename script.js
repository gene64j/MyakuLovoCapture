import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');

let scene, camera, renderer, controls;
let model;

init();
startCamera();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  // 初期は仮のサイズ、videoのメタデータ読込後に変更
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  // GLBモデル読み込み（model.glbは同じディレクトリに置く）
  const loader = new GLTFLoader();
  loader.load('model.glb',
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();

      controls.target.copy(center);
      camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, size * 1.5)));
      camera.lookAt(center);
    },
    undefined,
    (error) => {
      console.error('GLB読み込みエラー:', error);
    }
  );

  window.addEventListener('resize', onWindowResize);
  video.addEventListener('loadedmetadata', onVideoReady);

  captureBtn.addEventListener('click', onCaptureClick);
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(stream => {
      video.srcObject = stream;
      video.play();
    })
    .catch(err => {
      alert('カメラにアクセスできませんでした: ' + err.message);
    });
}

function onVideoReady() {
  updateRendererSize();
  animate();
}

function onWindowResize() {
  updateRendererSize();
}

function updateRendererSize() {
  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;
  if (!vidWidth || !vidHeight) return;

  const vidRatio = vidWidth / vidHeight;

  // CSS上のvideo表示サイズ計算
  const cssWidth = window.innerWidth;
  const cssHeight = cssWidth / vidRatio;

  // videoサイズをCSSで設定
  video.style.width = cssWidth + 'px';
  video.style.height = cssHeight + 'px';

  // canvasのCSSサイズも合わせる
  renderer.domElement.style.width = cssWidth + 'px';
  renderer.domElement.style.height = cssHeight + 'px';

  // WebGL内部解像度はvideoのピクセルサイズに合わせる
  renderer.setSize(vidWidth, vidHeight, false);

  // カメラのアスペクト比更新
  camera.aspect = vidRatio;
  camera.updateProjectionMatrix();

  // ボタンはvideo表示の下、黒帯の中央に配置
  const bottomOffset = window.innerHeight - cssHeight;
  captureBtn.style.bottom = (bottomOffset + 20) + 'px';
}

function onCaptureClick() {
  // canvas作成
  const captureCanvas = document.createElement('canvas');

  // サイズはvideoのピクセルサイズ
  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;
  if (!vidWidth || !vidHeight) return;

  captureCanvas.width = vidWidth;
  captureCanvas.height = vidHeight;
  const ctx = captureCanvas.getContext('2d');

  // videoを描画
  ctx.drawImage(video, 0, 0, vidWidth, vidHeight);

  // Three.jsのcanvas（WebGL）を描画
  // renderer.domElementはvidWidth x vidHeightなのでそのまま描画可能
  ctx.drawImage(renderer.domElement, 0, 0, vidWidth, vidHeight);

  // jpegで保存
  captureCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capture.jpg';
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.95);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
