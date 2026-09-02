import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Stable Bloom v2';

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
scene.fog = new THREE.FogExp2(0x211621, 0.165);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.25, 3.05, 5.05);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.24;
controls.enablePan = false;
controls.minDistance = 3.7;
controls.maxDistance = 8.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.08, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xd8ffe0, 0x07120b, 1.35);
scene.add(ambient);

const softRim = new THREE.DirectionalLight(0xd0ffcf, 2.15);
softRim.position.set(-3.7, 5.8, 2.7);
scene.add(softRim);

[
  [0x9dff76, 7.0, -1.45, 0.82, 1.05],
  [0x66fff1, 5.8, 0.95, 0.65, -1.45],
  [0xff91bb, 4.8, 1.55, 1.1, 0.9],
  [0xf1ff9a, 5.2, -0.35, 1.45, -0.25],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.5);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);

function sCurveX(t) {
  return 0.5 + Math.sin((t - 0.08) * Math.PI * 2.0) * 0.22 + Math.sin(t * Math.PI * 4.0 + 0.8) * 0.035;
}

function tileX(uvX) {
  return (uvX - 0.5) * 4;
}

function tileZ(uvY) {
  return (uvY - 0.5) * 4;
}

function sampleNearWater(spread = 0.08) {
  const t = 0.08 + Math.random() * 0.84;
  const x = sCurveX(t) + (Math.random() - 0.5) * spread;
  return new THREE.Vector2(THREE.MathUtils.clamp(x, 0.08, 0.92), t);
}

const bloomCenters = [
  new THREE.Vector2(sCurveX(0.18) - 0.03, 0.18),
  new THREE.Vector2(sCurveX(0.32) + 0.08, 0.32),
  new THREE.Vector2(sCurveX(0.48) - 0.07, 0.48),
  new THREE.Vector2(sCurveX(0.64) + 0.06, 0.64),
  new THREE.Vector2(sCurveX(0.80) - 0.04, 0.80),
  new THREE.Vector2(0.22, 0.62),
  new THREE.Vector2(0.78, 0.30),
];

const tileUniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
};

const tile = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 240, 240),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vBloom;
      varying float vWet;
      varying float vWater;
      varying float vPulse;
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
          p *= 1.95;
          amp *= 0.48;
        }
        return value;
      }

      float sPathX(float y) {
        return 0.5 + sin((y - 0.08) * 6.2831853) * 0.22 + sin(y * 12.56637 + 0.8) * 0.035;
      }

      float colony(vec2 uv, vec2 center, float radius) {
        return smoothstep(radius, 0.0, distance(uv, center));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;

        float broad = fbm(p * 1.55 + vec2(0.0, uTime * 0.005));
        float moundField = fbm(p * 2.75 + vec2(5.2, -1.7));
        float fine = fbm(p * 5.0 - vec2(uTime * 0.014, 0.0));

        float pathX = sPathX(uv.y);
        float waterDist = abs(uv.x - pathX);
        float waterCore = smoothstep(0.105, 0.0, waterDist);
        float waterHalo = smoothstep(0.235, 0.0, waterDist);
        vWater = waterCore;

        float colonies = 0.0;
        colonies += colony(uv, vec2(sPathX(0.18) - 0.03, 0.18), 0.22) * 0.74;
        colonies += colony(uv, vec2(sPathX(0.32) + 0.08, 0.32), 0.25) * 0.84;
        colonies += colony(uv, vec2(sPathX(0.48) - 0.07, 0.48), 0.28) * 0.9;
        colonies += colony(uv, vec2(sPathX(0.64) + 0.06, 0.64), 0.24) * 0.82;
        colonies += colony(uv, vec2(sPathX(0.80) - 0.04, 0.80), 0.22) * 0.7;
        colonies += colony(uv, vec2(0.22, 0.62), 0.24) * 0.42;
        colonies += colony(uv, vec2(0.78, 0.30), 0.22) * 0.38;
        colonies += waterHalo * 0.38;
        vBloom = clamp(colonies, 0.0, 1.0);

        float wetPatches = smoothstep(0.42, 0.76, fbm(p * 3.1 + vec2(8.0, -4.0)));
        vWet = clamp(waterCore * 0.95 + waterHalo * 0.34 + wetPatches * 0.38, 0.0, 1.0);

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 10.5) * (0.62 + 0.38 * sin(mouseDist * 32.0 - uTime * 3.0));

        float softMounds = (broad - 0.5) * 0.16 + (moundField - 0.5) * 0.105 + (fine - 0.5) * 0.022;
        float waterSink = waterCore * 0.082 + vWet * 0.025;
        float colonyLift = vBloom * 0.055;

        vHeight = broad * 0.62 + moundField * 0.38;
        vec3 transformed = position;
        transformed.z = softMounds + colonyLift - waterSink + vPulse * 0.045;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vBloom;
      varying float vWet;
      varying float vWater;
      varying float vPulse;
      uniform float uTime;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.7, 289.1))) * 97143.231);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float sPathX(float y) {
        return 0.5 + sin((y - 0.08) * 6.2831853) * 0.22 + sin(y * 12.56637 + 0.8) * 0.035;
      }

      void main() {
        vec3 darkSoil = vec3(0.09, 0.145, 0.075);
        vec3 deepGreen = vec3(0.075, 0.235, 0.09);
        vec3 moss = vec3(0.25, 0.47, 0.13);
        vec3 paleGreen = vec3(0.74, 0.92, 0.34);
        vec3 wetCyan = vec3(0.16, 0.92, 0.82);
        vec3 pinkBloom = vec3(1.0, 0.45, 0.66);
        vec3 peach = vec3(1.0, 0.66, 0.42);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.14, 0.84, vHeight);
        float patchNoise = noise(vUv * 18.0 + vec2(0.0, uTime * 0.02));
        float matTexture = noise(vUv * 58.0) * 0.08;
        float pathX = sPathX(vUv.y);
        float waterDist = abs(vUv.x - pathX);
        float wetLine = smoothstep(0.092, 0.0, waterDist);
        float wetBank = smoothstep(0.22, 0.0, waterDist);
        float livingPulse = sin(uTime * 0.65 + vUv.x * 6.0 + vUv.y * 5.0) * 0.5 + 0.5;
        float sporeFleck = step(0.965, hash(floor(vUv * 150.0))) * smoothstep(0.42, 1.0, vBloom);

        vec3 color = mix(darkSoil, deepGreen, shade);
        color = mix(color, moss, smoothstep(0.25, 0.82, patchNoise) * 0.46);
        color = mix(color, paleGreen, vBloom * (0.42 + patchNoise * 0.22));
        color = mix(color, vec3(0.055, 0.19, 0.135), vWet * 0.34);
        color += wetCyan * wetLine * (0.28 + livingPulse * 0.1);
        color += wetCyan * wetBank * 0.12;
        color += pinkBloom * smoothstep(0.48, 0.94, vBloom) * (0.20 + livingPulse * 0.08);
        color += peach * sporeFleck * 0.24;
        color += paleGreen * vPulse * 0.32;
        color += pinkBloom * vPulse * smoothstep(0.38, 1.0, vBloom) * 0.12;
        color += matTexture;
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
  color: 0x9dffb4,
  transparent: true,
  opacity: 0.15,
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
  edge.position.set(x, -0.34, z);
  edge.rotation.x = -Math.PI / 2;
  scene.add(edge);
});

const waterPoints = [];
for (let i = 0; i < 72; i++) {
  const t = i / 71;
  waterPoints.push(new THREE.Vector3(tileX(sCurveX(t)), -0.295, tileZ(t)));
}

const waterCurve = new THREE.CatmullRomCurve3(waterPoints);
const waterRibbon = new THREE.Mesh(
  new THREE.TubeGeometry(waterCurve, 160, 0.018, 8, false),
  new THREE.MeshBasicMaterial({
    color: 0x72fff0,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(waterRibbon);

const diskGroup = new THREE.Group();
scene.add(diskGroup);

bloomCenters.forEach((center, i) => {
  const radius = [0.42, 0.5, 0.58, 0.48, 0.42, 0.38, 0.34][i];
  const material = new THREE.MeshBasicMaterial({
    color: [0xc9ff76, 0xff90bb, 0xe6ff8d, 0x84fff0, 0xffbd8d, 0xbfff7f, 0xff9fc7][i],
    transparent: true,
    opacity: i % 2 === 0 ? 0.16 : 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(radius, 72), material);
  disk.position.set(tileX(center.x), -0.285 + i * 0.004, tileZ(center.y));
  disk.rotation.x = -Math.PI / 2;
  disk.scale.y = 0.42 + i * 0.035;
  disk.userData.phase = i * 0.7;
  disk.userData.baseOpacity = material.opacity;
  diskGroup.add(disk);
});

const sporeCount = 2350;
const sporePositions = new Float32Array(sporeCount * 3);
const sporeColors = new Float32Array(sporeCount * 3);
const sporePalette = [
  new THREE.Color(0xdfff8e),
  new THREE.Color(0x9effcf),
  new THREE.Color(0xffa3c5),
  new THREE.Color(0xffbf8b),
  new THREE.Color(0x80fff0),
];

for (let i = 0; i < sporeCount; i++) {
  const nearWater = Math.random() < 0.72;
  const center = nearWater ? sampleNearWater(0.18) : bloomCenters[Math.floor(Math.random() * bloomCenters.length)];
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.9) * (nearWater ? 0.13 : 0.28);
  const uvX = center.x + Math.cos(angle) * radius;
  const uvY = center.y + Math.sin(angle) * radius * 0.7;
  const idx = i * 3;
  sporePositions[idx] = tileX(THREE.MathUtils.clamp(uvX, 0.03, 0.97));
  sporePositions[idx + 1] = 0.02 + Math.pow(Math.random(), 2.1) * 0.92;
  sporePositions[idx + 2] = tileZ(THREE.MathUtils.clamp(uvY, 0.03, 0.97));

  const color = sporePalette[Math.floor(Math.random() * sporePalette.length)].clone();
  color.lerp(new THREE.Color(0xf6ffe4), Math.random() * 0.26);
  sporeColors[idx] = color.r;
  sporeColors[idx + 1] = color.g;
  sporeColors[idx + 2] = color.b;
}

const sporeGeometry = new THREE.BufferGeometry();
sporeGeometry.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
sporeGeometry.setAttribute('color', new THREE.BufferAttribute(sporeColors, 3));

const sporeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  },
  transparent: true,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexShader: `
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;
    uniform vec2 uMouse;

    void main() {
      vColor = color;
      vec3 p = position;
      vec2 uv = p.xz / 4.0 + 0.5;
      float mouseDist = distance(uv, uMouse);
      float pulse = exp(-mouseDist * 8.5);
      p.y += sin(uTime * 0.48 + position.x * 1.5 + position.z * 1.1) * 0.032;
      p.x += sin(uTime * 0.29 + position.z * 1.7) * 0.011;
      p.z += cos(uTime * 0.26 + position.x * 1.8) * 0.011;
      p.y += pulse * 0.16;
      p.xz += normalize((uv - uMouse) + 0.0001) * pulse * 0.045;
      vAlpha = 0.28 + pulse * 0.4;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (15.0 + pulse * 15.0) / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 p = gl_PointCoord - vec2(0.5);
      float alpha = smoothstep(0.5, 0.0, length(p)) * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
});

const spores = new THREE.Points(sporeGeometry, sporeMaterial);
scene.add(spores);

const plantGroup = new THREE.Group();
scene.add(plantGroup);

function addBladeCluster(uv, count, color) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < count; i++) {
    const x = tileX(uv.x + (Math.random() - 0.5) * 0.055);
    const z = tileZ(uv.y + (Math.random() - 0.5) * 0.055);
    const h = 0.08 + Math.random() * 0.18;
    const lean = new THREE.Vector2((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.292, z),
      new THREE.Vector3(x + lean.x, -0.292 + h, z + lean.y),
    ]);
    const blade = new THREE.Line(geometry, material.clone());
    blade.material.opacity = 0.2 + Math.random() * 0.38;
    blade.userData.phase = Math.random() * Math.PI * 2;
    blade.userData.baseOpacity = blade.material.opacity;
    plantGroup.add(blade);
  }
}

function addReed(uv, height, color) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, -0.292, z),
    new THREE.Vector3(x + (Math.random() - 0.5) * 0.06, -0.292 + height, z + (Math.random() - 0.5) * 0.06),
  ]);
  const reed = new THREE.Line(geometry, material);
  reed.userData.phase = Math.random() * Math.PI * 2;
  reed.userData.baseOpacity = material.opacity;
  plantGroup.add(reed);
}

for (let i = 0; i < 34; i++) {
  addBladeCluster(sampleNearWater(0.3), 4 + Math.floor(Math.random() * 5), i % 4 === 0 ? 0xe5ff9d : 0x8eff8a);
}

for (let i = 0; i < 28; i++) {
  addReed(sampleNearWater(0.26), 0.16 + Math.random() * 0.38, i % 5 === 0 ? 0xc8ffd1 : 0x9cff7e);
}

const flowerGroup = new THREE.Group();
scene.add(flowerGroup);

function addFlower(uv, color) {
  const group = new THREE.Group();
  const stemMaterial = new THREE.LineBasicMaterial({
    color: 0xbaff8a,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const y = -0.286;
  const h = 0.06 + Math.random() * 0.05;
  const stem = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0)]),
    stemMaterial,
  );
  group.add(stem);

  const petalMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), petalMaterial);
    petal.position.set(Math.cos(i * Math.PI * 0.5) * 0.018, h, Math.sin(i * Math.PI * 0.5) * 0.018);
    petal.scale.set(1.0, 0.42, 1);
    petal.rotation.set(Math.PI / 2, 0, i * Math.PI * 0.5);
    group.add(petal);
  }
  group.position.set(x, y, z);
  group.userData.phase = Math.random() * Math.PI * 2;
  flowerGroup.add(group);
}

for (let i = 0; i < 20; i++) {
  addFlower(sampleNearWater(0.36), i % 3 === 0 ? 0xff9fbd : i % 3 === 1 ? 0xffc28b : 0xe8ff91);
}

const veilGroup = new THREE.Group();
scene.add(veilGroup);

const veilColors = [0xbaff9a, 0xff9ac0, 0x83fff0, 0xffc18f];
for (let i = 0; i < 7; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: veilColors[i % veilColors.length],
    transparent: true,
    opacity: 0.035 + Math.random() * 0.035,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const geometry = new THREE.CircleGeometry(0.12 + Math.random() * 0.16, 24);
  const veil = new THREE.Mesh(geometry, material);
  const uv = sampleNearWater(0.42);
  veil.position.set(tileX(uv.x), 0.2 + Math.random() * 0.65, tileZ(uv.y));
  veil.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  veil.scale.set(1.0 + Math.random() * 0.85, 0.18 + Math.random() * 0.22, 1);
  veil.userData.phase = Math.random() * Math.PI * 2;
  veil.userData.spin = 0.06 + Math.random() * 0.12;
  veil.userData.baseOpacity = material.opacity;
  veilGroup.add(veil);
}

const colonyRingGroup = new THREE.Group();
scene.add(colonyRingGroup);

for (let i = 0; i < 16; i++) {
  const center = bloomCenters[i % bloomCenters.length];
  const material = new THREE.MeshBasicMaterial({
    color: i % 3 === 0 ? 0xff9ab8 : i % 3 === 1 ? 0xd9ff84 : 0x84fff0,
    transparent: true,
    opacity: 0.085,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.065 + i * 0.011, 0.069 + i * 0.011, 72), material);
  ring.position.set(tileX(center.x + (Math.random() - 0.5) * 0.16), -0.276 + i * 0.002, tileZ(center.y + (Math.random() - 0.5) * 0.16));
  ring.rotation.x = -Math.PI / 2;
  ring.scale.y = 0.45 + Math.random() * 0.38;
  ring.userData.phase = i * 0.37;
  colonyRingGroup.add(ring);
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
        float alpha = smoothstep(0.30, 0.78, d) * 0.66;
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
  smoothPointer.lerp(pointer, 0.055);
  tileUniforms.uTime.value = elapsed;
  tileUniforms.uMouse.value.copy(smoothPointer);
  sporeMaterial.uniforms.uTime.value = elapsed;
  sporeMaterial.uniforms.uMouse.value.copy(smoothPointer);

  waterRibbon.material.opacity = 0.26 + (Math.sin(elapsed * 0.75) * 0.5 + 0.5) * 0.16;
  spores.rotation.y = Math.sin(elapsed * 0.07) * 0.055;
  spores.position.y = Math.sin(elapsed * 0.34) * 0.03;

  diskGroup.children.forEach((disk, i) => {
    const pulse = Math.sin(elapsed * 0.6 + disk.userData.phase) * 0.5 + 0.5;
    disk.material.opacity = disk.userData.baseOpacity + pulse * 0.04;
    disk.scale.x = 1.0 + pulse * 0.035;
  });

  plantGroup.children.forEach((plant, i) => {
    plant.rotation.z = Math.sin(elapsed * 0.72 + plant.userData.phase) * 0.018;
    plant.material.opacity = plant.userData.baseOpacity * (0.74 + (Math.sin(elapsed * 0.56 + i) * 0.5 + 0.5) * 0.38);
  });

  flowerGroup.children.forEach((flower, i) => {
    const pulse = Math.sin(elapsed * 0.9 + flower.userData.phase) * 0.5 + 0.5;
    flower.rotation.y += 0.002 + i * 0.00002;
    flower.scale.setScalar(0.92 + pulse * 0.18);
  });

  veilGroup.children.forEach((veil, i) => {
    veil.rotation.y += 0.001 * veil.userData.spin;
    veil.rotation.z += 0.0008 + i * 0.00003;
    veil.position.y += Math.sin(elapsed * 0.45 + veil.userData.phase) * 0.0005;
    veil.material.opacity = veil.userData.baseOpacity + (Math.sin(elapsed * 0.72 + i) * 0.5 + 0.5) * 0.018;
  });

  colonyRingGroup.children.forEach((ring, i) => {
    const pulse = Math.sin(elapsed * 0.55 + ring.userData.phase) * 0.5 + 0.5;
    ring.rotation.z += 0.0012 + i * 0.00006;
    ring.material.opacity = 0.045 + pulse * 0.07;
    ring.scale.x = 1.0 + pulse * 0.07;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();


