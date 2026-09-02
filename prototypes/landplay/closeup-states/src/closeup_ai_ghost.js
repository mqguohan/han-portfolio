import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - AI Ghost Layer';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x211621, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#211621';
canvas.style.display = 'block';
canvas.style.width = '100vw';
canvas.style.height = '100vh';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x211621);
scene.fog = new THREE.FogExp2(0x211621, 0.18);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.35, 3.25, 5.25);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.28;
controls.enablePan = false;
controls.minDistance = 3.8;
controls.maxDistance = 8.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 0.02, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xbfefff, 0x130816, 1.6);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0x80eaff, 2.25);
rim.position.set(-4, 6, 3);
scene.add(rim);

[
  [0x34eaff, 10.5, -1.85, 1.7, -2.0],
  [0xff67ad, 6.6, 2.0, 1.25, 1.1],
  [0x9b7dff, 4.0, 0.2, 2.2, 1.8],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 8.5);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);

const tileUniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
};

const tile = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 230, 230),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vMissing;
      varying float vSeam;
      varying float vScan;
      uniform float uTime;
      uniform vec2 uMouse;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p *= 2.03;
          amp *= 0.48;
        }
        return value;
      }

      float mapLine(float value, float width) {
        return 1.0 - smoothstep(0.0, width, abs(fract(value) - 0.5));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float terrain = fbm(p * 2.12 + vec2(0.0, uTime * 0.012));
        float ridges = sin(p.x * 8.0 + terrain * 5.0 + uTime * 0.36) * 0.022
          + sin(p.y * 7.3 - terrain * 3.6) * 0.017;

        float voidA = smoothstep(0.53, 0.66, fbm(p * 2.9 + vec2(12.0, -6.0)));
        float voidB = smoothstep(0.70, 0.78, noise(p * 7.2 + vec2(3.0, 14.0)));
        vMissing = clamp(voidA * 0.9 + voidB * 0.42, 0.0, 1.0);

        float seamX = mapLine(uv.x * 6.4 + floor(uv.y * 5.0) * 0.07, 0.038);
        float seamY = mapLine(uv.y * 7.3 + floor(uv.x * 4.0) * 0.052, 0.034);
        float failedPass = mapLine((uv.x + uv.y * 0.18 + terrain * 0.06 + uTime * 0.007) * 12.0, 0.027);
        float brokenMask = smoothstep(0.44, 0.68, noise(p * 11.0 + 4.0));
        vSeam = max(max(seamX * 0.7, seamY * 0.58), failedPass * brokenMask) * (1.0 - vMissing * 0.55);

        float scanA = mapLine((uv.x * 0.7 + uv.y * 0.3 + uTime * 0.026) * 7.0, 0.032);
        float scanB = 1.0 - smoothstep(0.01, 0.06, abs(distance(uv, vec2(0.66, 0.38)) - 0.22));
        vScan = max(scanA * 0.45, scanB * 0.55) * (1.0 - vMissing * 0.35);

        float mouseDist = distance(uv, uMouse);
        float disturbance = exp(-mouseDist * 11.5) * sin(mouseDist * 46.0 - uTime * 4.4) * 0.075;

        vHeight = terrain;
        vec3 transformed = position;
        transformed.z = (terrain - 0.5) * 0.26 + ridges + disturbance;
        transformed.z -= vMissing * 0.105;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vMissing;
      varying float vSeam;
      varying float vScan;
      uniform float uTime;

      void main() {
        vec3 shadow = vec3(0.045, 0.06, 0.075);
        vec3 lowTerrain = vec3(0.22, 0.30, 0.32);
        vec3 paleTerrain = vec3(0.72, 0.80, 0.79);
        vec3 voidColor = vec3(0.129, 0.086, 0.129);
        vec3 cyan = vec3(0.06, 0.9, 1.0);
        vec3 pink = vec3(1.0, 0.34, 0.62);
        vec3 violet = vec3(0.55, 0.42, 1.0);

        float edgeFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, vUv.y)
          * smoothstep(0.0, 0.06, 1.0 - vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.y);
        float shade = smoothstep(0.15, 0.86, vHeight);
        float pulse = sin(uTime * 0.8 + vUv.x * 5.0 - vUv.y * 3.0) * 0.5 + 0.5;
        float shimmer = sin(vUv.x * 92.0 + uTime) * sin(vUv.y * 75.0 - uTime * 0.8) * 0.018;

        vec3 color = mix(lowTerrain, paleTerrain, shade);
        color = mix(color, shadow, smoothstep(0.0, 0.25, vHeight) * 0.25);
        color = mix(color, voidColor, vMissing);
        color += cyan * vSeam * (0.72 + pulse * 0.32);
        color += violet * vSeam * 0.22;
        color += cyan * vScan * 0.45;
        color += pink * smoothstep(0.30, 0.0, distance(vUv, vec2(0.78, 0.35))) * 0.22;
        color += cyan * smoothstep(0.24, 0.0, distance(vUv, vec2(0.22, 0.72))) * 0.25;
        color += shimmer;
        color = mix(vec3(0.129, 0.086, 0.129), color, edgeFade);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.38;
scene.add(tile);

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0x55f5ff,
  transparent: true,
  opacity: 0.22,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

[
  [0, -2.02, 4.08, 0.012],
  [0, 2.02, 4.08, 0.012],
  [-2.02, 0, 0.012, 4.08],
  [2.02, 0, 0.012, 4.08],
].forEach(([x, z, w, h]) => {
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(w, h), edgeMaterial);
  edge.position.set(x, -0.345, z);
  edge.rotation.x = -Math.PI / 2;
  scene.add(edge);
});

const seamGroup = new THREE.Group();
scene.add(seamGroup);

function makeTube(points, color, opacity, radius = 0.005) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 88, radius, 6, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  seamGroup.add(mesh);
  return mesh;
}

for (let i = 0; i < 13; i++) {
  const horizontal = i % 2 === 0;
  const fixed = -1.86 + i * 0.31;
  const points = [];
  for (let j = 0; j < 8; j++) {
    const travel = -1.92 + j * 0.55;
    const jitter = Math.sin(i * 1.37 + j * 0.91) * 0.028;
    points.push(horizontal
      ? new THREE.Vector3(travel, -0.2 + Math.sin(j + i) * 0.025, fixed + jitter)
      : new THREE.Vector3(fixed + jitter, -0.2 + Math.cos(j + i) * 0.025, travel));
  }
  makeTube(points, i % 4 === 0 ? 0xd49aff : i % 3 === 0 ? 0xff6fab : 0x2df3ff, i % 4 === 0 ? 0.18 : 0.3);
}

const cloudCount = 2200;
const cloudPositions = new Float32Array(cloudCount * 3);
const cloudColors = new Float32Array(cloudCount * 3);
const cloudPalette = [
  new THREE.Color(0x6df4ff),
  new THREE.Color(0xff7fba),
  new THREE.Color(0xb79bff),
  new THREE.Color(0xd8ffff),
];

for (let i = 0; i < cloudCount; i++) {
  const r = Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * r * 2.34;
  const z = Math.sin(angle) * r * 2.34;
  const y = 0.03 + Math.random() * 1.2 + (1 - r) * 0.12;
  const idx = i * 3;
  cloudPositions[idx] = x;
  cloudPositions[idx + 1] = y;
  cloudPositions[idx + 2] = z;

  const color = cloudPalette[Math.floor(Math.random() * cloudPalette.length)].clone();
  color.lerp(new THREE.Color(0xe8ffff), Math.random() * 0.25);
  cloudColors[idx] = color.r;
  cloudColors[idx + 1] = color.g;
  cloudColors[idx + 2] = color.b;
}

const cloudGeometry = new THREE.BufferGeometry();
cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));

const pointCloud = new THREE.Points(
  cloudGeometry,
  new THREE.PointsMaterial({
    size: 0.018,
    vertexColors: true,
    transparent: true,
    opacity: 0.47,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(pointCloud);

const fragmentGroup = new THREE.Group();
scene.add(fragmentGroup);

const fragmentColors = [0x70f7ff, 0xff82bd, 0xb799ff, 0xd9ffff];
for (let i = 0; i < 12; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: fragmentColors[i % fragmentColors.length],
    transparent: true,
    opacity: 0.055 + Math.random() * 0.07,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fragment = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25 + Math.random() * 0.68, 0.14 + Math.random() * 0.48),
    material,
  );
  fragment.position.set((Math.random() - 0.5) * 3.7, 0.25 + Math.random() * 1.28, (Math.random() - 0.5) * 3.7);
  fragment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  fragment.userData.spin = 0.12 + Math.random() * 0.34;
  fragment.userData.baseOpacity = material.opacity;
  fragmentGroup.add(fragment);
}

const frameGroup = new THREE.Group();
scene.add(frameGroup);

function makeBrokenMapFrame(x, y, z, width, height, color, rotationY) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pieces = [
    [-width * 0.28, height * 0.5, width * 0.44, 0.012],
    [width * 0.26, height * 0.5, width * 0.28, 0.012],
    [-width * 0.5, -height * 0.22, 0.012, height * 0.56],
    [width * 0.5, height * 0.18, 0.012, height * 0.46],
    [width * 0.18, -height * 0.5, width * 0.54, 0.012],
  ];

  pieces.forEach(([px, py, pw, ph]) => {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), material);
    bar.position.set(px, py, 0);
    group.add(bar);
  });

  group.position.set(x, y, z);
  group.rotation.set(-0.22 + Math.random() * 0.2, rotationY, 0.06 - Math.random() * 0.12);
  group.userData.phase = Math.random() * Math.PI * 2;
  frameGroup.add(group);
}

makeBrokenMapFrame(-1.65, 0.72, -0.95, 0.88, 0.58, 0x85fff2, 0.8);
makeBrokenMapFrame(1.54, 0.96, 0.36, 0.78, 0.74, 0xff8bc9, -0.72);
makeBrokenMapFrame(0.25, 1.24, -1.65, 1.05, 0.5, 0xb79cff, 0.18);
makeBrokenMapFrame(-0.2, 0.48, 1.66, 0.72, 0.52, 0xcfffff, -0.12);

const probeGroup = new THREE.Group();
scene.add(probeGroup);

for (let i = 0; i < 8; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.12 + i * 0.026, 0.0035, 8, 64),
    new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xff6dab : 0x46f6ff,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.position.set(-1.72 + i * 0.49, 0.03 + Math.sin(i * 1.23) * 0.12, -1.28 + Math.cos(i * 0.92) * 1.15);
  ring.rotation.x = Math.PI / 2;
  ring.userData.phase = i * 0.65;
  ring.userData.baseScale = 0.85 + Math.random() * 0.5;
  probeGroup.add(ring);
}

const vignette = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5));
        float alpha = smoothstep(0.28, 0.78, d) * 0.68;
        gl_FragColor = vec4(0.129, 0.086, 0.129, alpha);
      }
    `,
  }),
);
vignette.renderOrder = 10;
scene.add(vignette);

window.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = 1 - event.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  smoothPointer.lerp(pointer, 0.06);
  tileUniforms.uTime.value = elapsed;
  tileUniforms.uMouse.value.copy(smoothPointer);

  pointCloud.rotation.y = Math.sin(elapsed * 0.11) * 0.14;
  pointCloud.position.y = Math.sin(elapsed * 0.45) * 0.045;
  seamGroup.position.y = -0.05 + Math.sin(elapsed * 0.48) * 0.025;

  fragmentGroup.children.forEach((fragment, i) => {
    fragment.rotation.y += 0.0022 * fragment.userData.spin;
    fragment.rotation.z += 0.0014 + i * 0.00009;
    fragment.material.opacity = fragment.userData.baseOpacity + (Math.sin(elapsed * 1.4 + i) * 0.5 + 0.5) * 0.055;
  });

  frameGroup.children.forEach((frame, i) => {
    frame.position.y += Math.sin(elapsed * 0.55 + frame.userData.phase) * 0.0009;
    frame.rotation.z += Math.sin(elapsed * 0.28 + i) * 0.00025;
  });

  probeGroup.children.forEach((probe) => {
    const phase = elapsed * 1.05 + probe.userData.phase;
    probe.scale.setScalar(probe.userData.baseScale + Math.sin(phase) * 0.18);
    probe.material.opacity = 0.13 + (Math.sin(phase) * 0.5 + 0.5) * 0.34;
    probe.rotation.z += 0.0065;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();



