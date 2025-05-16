/* bodyは余白なし、overflow隠し */
body {
  margin: 0;
  overflow: hidden;
  position: relative;
  touch-action: none;
  background-color: black;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: auto;
  max-height: 100vh;
  object-fit: contain;
  background-color: black;
  z-index: 0;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto; /* 操作可能 */
  z-index: 1;
  user-select: none;
}

#captureBtn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  z-index: 10;
  user-select: none;
  /* bottomはscript.jsで調整 */
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
