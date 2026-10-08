import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const canvas = document.querySelector("#glasses");
const stage = document.querySelector("#stage");
if (!canvas || !stage) throw new Error("Falta o escenario dos lentes");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Renderizador con transparencia total
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();

// Configuración da cámara para unha vista ampla de fondo
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
camera.position.set(0, 0, 10);

// Entorno e Iluminación
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const navyRimLight = new THREE.DirectionalLight(0x122b5c, 2.8);
navyRimLight.position.set(-5, -3, -2);
scene.add(navyRimLight);

// Materiais coordinados coa paleta da marca
const materials = {
  gold: new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.15,
    clearcoat: 0.6
  }),
  navy: new THREE.MeshPhysicalMaterial({
    color: 0x122b5c,
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.4
  }),
  optiBlue: new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 0.5
  }),
  pinkCrystal: new THREE.MeshPhysicalMaterial({
    color: 0xe8a2b8,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.75,
    thickness: 0.5,
    ior: 1.48,
    transparent: true,
    opacity: 0.9
  }),
  techCyan: new THREE.MeshPhysicalMaterial({
    color: 0x00b4d8,
    metalness: 0.85,
    roughness: 0.2,
    clearcoat: 0.4
  }),
  lensClear: new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    metalness: 0,
    roughness: 0.04,
    transmission: 0.96,
    thickness: 0.35,
    ior: 1.52,
    transparent: true
  })
};

// --- FABRICACIÓN DE MODELOS 3D (TAMAÑO PROPORCIONAL) ---
function createRoundGoldGlasses() {
  const group = new THREE.Group();
  const rimMat = materials.gold;
  const glassMat = materials.lensClear;

  [-0.65, 0.65].forEach((x) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 16, 48), rimMat);
    rim.position.x = x;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.03, 32), glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.x = x;
    group.add(rim, glass);
  });

  const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 12, 20, Math.PI), rimMat);
  bridge.rotation.z = Math.PI;
  bridge.position.set(0, 0.18, 0);
  group.add(bridge);

  [-1.15, 1.15].forEach((x) => {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 1.1), rimMat);
    temple.position.set(x, 0.05, -0.55);
    temple.rotation.y = x > 0 ? -0.12 : 0.12;
    group.add(temple);
  });

  return group;
}

function createPinkGlasses() {
  const group = new THREE.Group();
  const rimMat = materials.pinkCrystal;
  const glassMat = materials.lensClear;

  [-0.68, 0.68].forEach((x) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 16, 40), rimMat);
    rim.position.x = x;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.03, 32), glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.x = x;
    group.add(rim, glass);
  });

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.05), rimMat);
  bridge.position.set(0, 0.15, 0);
  group.add(bridge);

  [-1.2, 1.2].forEach((x) => {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.1), rimMat);
    temple.position.set(x, 0.1, -0.55);
    group.add(temple);
  });

  return group;
}

function createNavyModernGlasses() {
  const group = new THREE.Group();
  const rimMat = materials.navy;
  const glassMat = materials.lensClear;

  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.38);
  shape.lineTo(0.5, -0.38);
  shape.lineTo(0.55, 0.38);
  shape.lineTo(-0.55, 0.38);
  shape.closePath();

  [-0.68, 0.68].forEach((x) => {
    const frameGeom = new THREE.ShapeGeometry(shape);
    const glass = new THREE.Mesh(frameGeom, glassMat);
    glass.position.set(x, 0, 0);
    glass.scale.set(0.9, 0.9, 1);

    const wireGeom = new THREE.WireframeGeometry(frameGeom);
    const line = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({ color: 0x122b5c, linewidth: 2 }));
    line.position.set(x, 0, 0.02);

    group.add(glass, line);
  });

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.04), rimMat);
  bridge.position.set(0, 0.2, 0);
  group.add(bridge);

  [-1.2, 1.2].forEach((x) => {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.2), rimMat);
    temple.position.set(x, 0.1, -0.6);
    group.add(temple);
  });

  return group;
}

function createCyanAviatorGlasses() {
  const group = new THREE.Group();
  const rimMat = materials.techCyan;
  const glassMat = materials.lensClear;

  [-0.7, 0.7].forEach((x) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 16, 40), rimMat);
    rim.scale.set(1, 0.82, 1);
    rim.position.x = x;

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 32), glassMat);
    glass.scale.set(1, 1, 0.82);
    glass.rotation.x = Math.PI / 2;
    glass.position.x = x;

    group.add(rim, glass);
  });

  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 12), rimMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 0.35, 0);

  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 12), rimMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.15, 0);

  group.add(topBar, bridge);

  [-1.25, 1.25].forEach((x) => {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.15), rimMat);
    temple.position.set(x, 0.2, -0.55);
    group.add(temple);
  });

  return group;
}

const glassesFactories = [
  createRoundGoldGlasses,
  createPinkGlasses,
  createNavyModernGlasses,
  createCyanAviatorGlasses
];

// --- SISTEMA DE LENTES EN TODO O FONDO (AMPLO ALCANCE HORIZONTAL E VERTICAL) ---
const fallingGlasses = [];
const GLASSES_COUNT = reduce ? 4 : 10; // Incrementado o número para cubrir todo o fondo

function resetGlasses(item) {
  // Rango horizontal amplo (-14 a +14) para cubrir todo o ancho do fondo
  item.position.x = (Math.random() - 0.5) * 16.0;
  item.position.y = 5.5 + Math.random() * 5.0;
  item.position.z = (Math.random() - 0.5) * 3.0;

  item.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  item.userData.speedY = 0.01 + Math.random() * 0.018;
  item.userData.rotSpeed = {
    x: (Math.random() - 0.5) * 0.02,
    y: (Math.random() - 0.5) * 0.025,
    z: (Math.random() - 0.5) * 0.02
  };
  
  // Tamaños orixinais e equilibrados (0.85x a 1.25x)
  item.scale.setScalar(0.85 + Math.random() * 0.4);
  item.visible = true;
}

for (let i = 0; i < GLASSES_COUNT; i++) {
  const factory = glassesFactories[i % glassesFactories.length];
  const model = factory();
  model.userData = {};
  resetGlasses(model);
  model.position.y += i * 1.2;
  scene.add(model);
  fallingGlasses.push(model);
}

// --- EXPLOSIÓN E PARTÍCULAS ---
const particles = [];
const particleGroup = new THREE.Group();
scene.add(particleGroup);

const shardGeometries = [
  new THREE.TetrahedronGeometry(0.1),
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.OctahedronGeometry(0.08)
];

const particleMaterials = [
  materials.gold,
  materials.navy,
  materials.pinkCrystal,
  materials.techCyan,
  new THREE.MeshBasicMaterial({ color: 0xffffff })
];

function createExplosion(position) {
  const shardCount = reduce ? 20 : 40;

  const ringGeom = new THREE.RingGeometry(0.12, 0.25, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x2563eb,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95
  });
  const shockwave = new THREE.Mesh(ringGeom, ringMat);
  shockwave.position.copy(position);
  shockwave.rotation.x = Math.PI / 2;
  scene.add(shockwave);

  let shockScale = 1;
  const expandShock = () => {
    shockScale += 0.22;
    shockwave.scale.setScalar(shockScale);
    ringMat.opacity -= 0.05;
    if (ringMat.opacity > 0) {
      requestAnimationFrame(expandShock);
    } else {
      scene.remove(shockwave);
      ringGeom.dispose();
      ringMat.dispose();
    }
  };
  expandShock();

  for (let i = 0; i < shardCount; i++) {
    const geom = shardGeometries[Math.floor(Math.random() * shardGeometries.length)];
    const mat = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
    const p = new THREE.Mesh(geom, mat);

    p.position.copy(position);
    p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const speed = 0.09 + Math.random() * 0.15;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;

    p.userData = {
      velocity: new THREE.Vector3(
        speed * Math.cos(phi) * Math.cos(theta),
        speed * Math.sin(phi) + 0.02,
        speed * Math.cos(phi) * Math.sin(theta)
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      life: 1.0,
      decay: 0.02 + Math.random() * 0.02
    };

    particleGroup.add(p);
    particles.push(p);
  }
}

// --- INTERACCIÓN CLICK (RAYCASTING) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

stage.addEventListener("pointerdown", (event) => {
  const rect = stage.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const visibleGlasses = fallingGlasses.filter((g) => g.visible);
  const intersects = raycaster.intersectObjects(visibleGlasses, true);

  if (intersects.length > 0) {
    let hitObject = intersects[0].object;
    while (hitObject.parent && !fallingGlasses.includes(hitObject)) {
      hitObject = hitObject.parent;
    }

    if (fallingGlasses.includes(hitObject)) {
      const hitPos = new THREE.Vector3();
      hitObject.getWorldPosition(hitPos);

      createExplosion(hitPos);

      hitObject.visible = false;
      setTimeout(() => resetGlasses(hitObject), 650);
    }
  }
});

stage.addEventListener("pointermove", (event) => {
  const rect = stage.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const visibleGlasses = fallingGlasses.filter((g) => g.visible);
  const intersects = raycaster.intersectObjects(visibleGlasses, true);

  stage.style.cursor = intersects.length > 0 ? "pointer" : "default";
});

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

function animate() {
  resize();

  fallingGlasses.forEach((item) => {
    if (!item.visible) return;

    if (!reduce) {
      item.position.y -= item.userData.speedY;
      item.rotation.x += item.userData.rotSpeed.x;
      item.rotation.y += item.userData.rotSpeed.y;
      item.rotation.z += item.userData.rotSpeed.z;
    }

    if (item.position.y < -5.5) {
      resetGlasses(item);
    }
  });

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.userData.velocity);
    p.rotation.x += p.userData.rotSpeed.x;
    p.rotation.y += p.userData.rotSpeed.y;
    p.userData.velocity.y -= 0.003;
    p.userData.life -= p.userData.decay;
    p.scale.setScalar(Math.max(0.001, p.userData.life));

    if (p.userData.life <= 0) {
      particleGroup.remove(p);
      p.geometry.dispose();
      particles.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();