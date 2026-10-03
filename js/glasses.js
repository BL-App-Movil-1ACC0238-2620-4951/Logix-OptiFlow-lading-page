import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const canvas = document.querySelector("#glasses");
const stage = document.querySelector("#stage");
if (!canvas || !stage) throw new Error("Falta el escenario de los lentes");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
camera.position.set(0, 0.32, 5.05);
camera.lookAt(0, -0.2, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

scene.add(new THREE.AmbientLight(0xfff6ee, 0.35));
const key = new THREE.DirectionalLight(0xfff3dd, 2.4);
key.position.set(2.4, 3.2, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0x9ec4ff, 1.1);
rim.position.set(-3, 1.4, -2);
scene.add(rim);
const blush = new THREE.PointLight(0xff8eaa, 6, 9);
blush.position.set(0.2, -1.1, 1.6);
scene.add(blush);

const gold = new THREE.MeshPhysicalMaterial({
  color: 0xe7c56a,
  metalness: 1,
  roughness: 0.22,
  clearcoat: 0.35,
});
const lensMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf7fbff,
  metalness: 0,
  roughness: 0.04,
  transmission: 0.94,
  thickness: 0.45,
  ior: 1.52,
  transparent: true,
});
const padMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf6ead0,
  metalness: 0.05,
  roughness: 0.42,
});

const glasses = new THREE.Group();
scene.add(glasses);

function addLens(x) {
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.045, 20, 64), gold);
  rim.position.x = x;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.045, 48), lensMaterial);
  glass.rotation.x = Math.PI / 2;
  glass.position.set(x, 0, 0);
  glasses.add(rim, glass);
}

addLens(-0.7);
addLens(0.7);

const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 12, 24, Math.PI), gold);
bridge.rotation.z = Math.PI;
bridge.position.set(0, 0.2, 0);
glasses.add(bridge);

function addPad(x) {
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), padMaterial);
  pad.scale.z = 0.55;
  pad.position.set(x, -0.34, 0.08);
  glasses.add(pad);
}

addPad(-0.16);
addPad(0.16);

function addTemple(side) {
  const temple = new THREE.Group();
  temple.position.set(side * 1.27, 0.08, 0);

  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.11, 16), gold);
  pin.rotation.z = Math.PI / 2;
  temple.add(pin);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(side * 0.02, -0.01, -0.22),
    new THREE.Vector3(side * 0.04, -0.04, -0.7),
    new THREE.Vector3(side * 0.05, -0.08, -1.15),
    new THREE.Vector3(side * 0.06, -0.24, -1.32),
    new THREE.Vector3(side * 0.07, -0.46, -1.28),
  ]);
  temple.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.032, 14, false), gold));
  temple.rotation.y = side * -0.16;
  glasses.add(temple);
}

addTemple(-1);
addTemple(1);

glasses.position.set(0, -0.32, 0);
glasses.rotation.set(0.12, 0, 0);
glasses.scale.setScalar(0.92);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.15, 40),
  new THREE.MeshBasicMaterial({ color: 0x8d4d5c, transparent: true, opacity: 0.16 })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.set(0, -0.78, 0.1);
scene.add(shadow);

const base = glasses.rotation.clone();
const aim = { x: base.x, y: base.y };

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const ratio = Math.min(window.devicePixelRatio, 2);
  if (!width || !height) return;
  if (canvas.width === Math.floor(width * ratio) && canvas.height === Math.floor(height * ratio)) return;
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

if (!reduce) {
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    aim.y = base.y + x * 2.8;
    aim.x = base.x + y * -1.15;
  });
  stage.addEventListener("pointerleave", () => {
    aim.x = base.x;
    aim.y = base.y;
  });
}

const clock = new THREE.Clock();

function frame() {
  const t = clock.getElapsedTime();
  if (!reduce) {
    glasses.position.y = -0.32 + Math.sin(t * 1.3) * 0.04;
    glasses.rotation.x += (aim.x - glasses.rotation.x) * 0.16;
    glasses.rotation.y += (aim.y - glasses.rotation.y) * 0.16;
    shadow.scale.setScalar(1 - Math.sin(t * 1.3) * 0.04);
  }
  resize();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

frame();
