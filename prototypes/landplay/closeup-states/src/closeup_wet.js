import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Wet Marsh';

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
scene.fog = new THREE.FogExp2(0x211621, 0.155);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.25, 2.95, 5.18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.22;
controls.enablePan = false;
controls.minDistance = 3.8;
controls.maxDistance = 8.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.12, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xbfffe6, 0x07100a, 1.28);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0xb8ffe8, 1.95);
rim.position.set(-3.7, 5.7, 2.8);
scene.add(rim);

[
  [0x5caea0, 3.4, 1.2, 0.8, -1.45],
  [0x9ac884, 3.4, -1.45, 0.9, 1.1],
  [0x586f8a, 2.0, -0.2, 1.5, 1.45],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.5);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);

function sCurveX(t) {
  return 0.5 + Math.sin((t - 0.07) * Math.PI * 2.0) * 0.22 + Math.sin(t * Math.PI * 4.0 + 0.7) * 0.036;
}

function tileX(uvX) {
  return (uvX - 0.5) * 4;
}

function tileZ(uvY) {
  return (uvY - 0.5) * 4;
}

function sampleWater(spread = 0.12) {
  const t = 0.07 + Math.random() * 0.86;
  const x = sCurveX(t) + (Math.random() - 0.5) * spread;
  return new THREE.Vector2(THREE.MathUtils.clamp(x, 0.06, 0.94), t);
}

const poolCenters = [
  new THREE.Vector2(sCurveX(0.18) - 0.08, 0.18),
  new THREE.Vector2(sCurveX(0.34) + 0.1, 0.34),
  new THREE.Vector2(sCurveX(0.52) - 0.08, 0.52),
  new THREE.Vector2(sCurveX(0.72) + 0.07, 0.72),
  new THREE.Vector2(0.23, 0.62),
  new THREE.Vector2(0.78, 0.28),
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
      varying float vWater;
      varying float vPool;
      varying float vMarsh;
      varying float vRipple;
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
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p *= 1.96;
          amp *= 0.48;
        }
        return value;
      }

      float sPathX(float y) {
        return 0.5 + sin((y - 0.07) * 6.2831853) * 0.22 + sin(y * 12.56637 + 0.7) * 0.036;
      }

      float pool(vec2 uv, vec2 center, float radius) {
        vec2 d = (uv - center) * vec2(1.0, 1.32);
        return smoothstep(radius, 0.0, length(d));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.45 + vec2(0.0, uTime * 0.004));
        float mud = fbm(p * 3.05 + vec2(6.0, -2.5));
        float fine = fbm(p * 5.2 - vec2(uTime * 0.012, 0.0));

        float pathX = sPathX(uv.y);
        float waterDist = abs(uv.x - pathX);
        float waterCore = smoothstep(0.15, 0.0, waterDist);
        float waterBank = smoothstep(0.34, 0.0, waterDist);
        vWater = waterCore;

        float pools = 0.0;
        pools += pool(uv, vec2(sPathX(0.18) - 0.08, 0.18), 0.22);
        pools += pool(uv, vec2(sPathX(0.34) + 0.1, 0.34), 0.25);
        pools += pool(uv, vec2(sPathX(0.52) - 0.08, 0.52), 0.28);
        pools += pool(uv, vec2(sPathX(0.72) + 0.07, 0.72), 0.23);
        pools += pool(uv, vec2(0.23, 0.62), 0.2) * 0.55;
        pools += pool(uv, vec2(0.78, 0.28), 0.2) * 0.5;
        vPool = clamp(pools, 0.0, 1.0);

        vMarsh = clamp(waterBank * 0.46 + smoothstep(0.42, 0.82, mud) * 0.44 + smoothstep(0.58, 0.9, fine) * 0.12, 0.0, 1.0);
        vRipple = (sin((uv.x + uv.y) * 38.0 + mud * 6.0 - uTime * 1.2) * 0.5 + 0.5) * (vWater + vPool * 0.72);

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 10.2) * (0.62 + 0.38 * sin(mouseDist * 34.0 - uTime * 3.2));

        float softMud = (broad - 0.5) * 0.095 + (mud - 0.5) * 0.074 + (fine - 0.5) * 0.018;
        float wetSink = waterCore * 0.062 + vPool * 0.06;
        float saturatedLift = vMarsh * 0.032;

        vHeight = broad * 0.56 + mud * 0.44;
        vec3 transformed = position;
        transformed.z = softMud - wetSink + saturatedLift + vPulse * 0.036;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vWater;
      varying float vPool;
      varying float vMarsh;
      varying float vRipple;
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
        return 0.5 + sin((y - 0.07) * 6.2831853) * 0.22 + sin(y * 12.56637 + 0.7) * 0.036;
      }

      void main() {
        vec3 darkMud = vec3(0.13, 0.085, 0.048);
        vec3 wetBrown = vec3(0.30, 0.20, 0.11);
        vec3 oliveBrown = vec3(0.25, 0.27, 0.12);
        vec3 marshGreen = vec3(0.18, 0.32, 0.16);
        vec3 moss = vec3(0.40, 0.54, 0.24);
        vec3 wetSoilBlue = vec3(0.16, 0.24, 0.27);
        vec3 blueGreen = vec3(0.045, 0.22, 0.23);
        vec3 mutedTeal = vec3(0.12, 0.44, 0.40);
        vec3 paleCyan = vec3(0.44, 0.78, 0.72);
        vec3 purpleShadow = vec3(0.12, 0.095, 0.16);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.13, 0.84, vHeight);
        float mudNoise = noise(vUv * 22.0 + vec2(0.0, uTime * 0.01));
        float pathX = sPathX(vUv.y);
        float waterDist = abs(vUv.x - pathX);
        float waterLine = smoothstep(0.14, 0.0, waterDist);
        float waterEdge = smoothstep(0.18, 0.11, waterDist) * smoothstep(0.03, 0.12, waterDist);
        float waterBank = smoothstep(0.34, 0.0, waterDist);
        float reflective = smoothstep(0.56, 0.92, noise(vUv * 52.0 - vec2(uTime * 0.012, uTime * 0.008))) * (vWater + vPool * 0.62);
        float rippleLine = (1.0 - smoothstep(0.0, 0.035, abs(fract((vUv.x * 0.45 + vUv.y * 0.72 + uTime * 0.018) * 9.0) - 0.5))) * (vWater + vPool * 0.5);

        vec3 color = mix(darkMud, wetBrown, shade * 0.58 + mudNoise * 0.22);
        color = mix(color, purpleShadow, (1.0 - shade) * 0.16);
        color = mix(color, oliveBrown, vMarsh * 0.22);
        color = mix(color, marshGreen, vMarsh * 0.26);
        color = mix(color, wetSoilBlue, waterBank * 0.18);
        color = mix(color, blueGreen, clamp(vWater * 0.68 + vPool * 0.52, 0.0, 0.78));
        color = mix(color, mutedTeal, waterLine * 0.18);
        color += moss * smoothstep(0.55, 0.94, vMarsh) * 0.13;
        color += paleCyan * waterEdge * 0.075;
        color += paleCyan * reflective * (0.055 + vRipple * 0.055);
        color += paleCyan * rippleLine * 0.045;
        color += paleCyan * vPulse * (vWater + vPool) * 0.09;
        color += moss * vPulse * smoothstep(0.34, 1.0, vMarsh) * 0.07;
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
  color: 0x74d2bd,
  transparent: true,
  opacity: 0.13,
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

const waterPoints = [];
for (let i = 0; i < 82; i++) {
  const t = i / 81;
  waterPoints.push(new THREE.Vector3(tileX(sCurveX(t)), -0.294, tileZ(t)));
}

const waterCurve = new THREE.CatmullRomCurve3(waterPoints);
const waterRibbon = new THREE.Mesh(
  new THREE.TubeGeometry(waterCurve, 170, 0.036, 9, false),
  new THREE.MeshBasicMaterial({
    color: 0x4c9d91,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(waterRibbon);

const poolGroup = new THREE.Group();
scene.add(poolGroup);

poolCenters.forEach((center, i) => {
  const material = new THREE.MeshBasicMaterial({
    color: i % 2 ? 0x4f8876 : 0x264e4c,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.24 + Math.random() * 0.18, 72), material);
  disk.position.set(tileX(center.x), -0.286 + i * 0.004, tileZ(center.y));
  disk.rotation.x = -Math.PI / 2;
  disk.scale.set(1.0 + Math.random() * 0.42, 0.42 + Math.random() * 0.25, 1);
  disk.rotation.z = Math.random() * Math.PI;
  disk.userData.phase = i * 0.62;
  disk.userData.baseOpacity = material.opacity;
  poolGroup.add(disk);
});

const mistCount = 540;
const mistPositions = new Float32Array(mistCount * 3);
const mistColors = new Float32Array(mistCount * 3);
const mistPalette = [
  new THREE.Color(0xa6fff0),
  new THREE.Color(0xc8ffe5),
  new THREE.Color(0xdff8ff),
  new THREE.Color(0x9fd6ff),
];

for (let i = 0; i < mistCount; i++) {
  const nearWater = Math.random() < 0.88;
  const uv = nearWater ? sampleWater(0.24) : poolCenters[Math.floor(Math.random() * poolCenters.length)];
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.86) * (nearWater ? 0.16 : 0.24);
  const idx = i * 3;
  mistPositions[idx] = tileX(THREE.MathUtils.clamp(uv.x + Math.cos(angle) * radius, 0.03, 0.97));
  mistPositions[idx + 1] = -0.13 + Math.pow(Math.random(), 2.2) * 0.68;
  mistPositions[idx + 2] = tileZ(THREE.MathUtils.clamp(uv.y + Math.sin(angle) * radius * 0.72, 0.03, 0.97));

  const color = mistPalette[Math.floor(Math.random() * mistPalette.length)].clone();
  color.lerp(new THREE.Color(0xf2fff8), Math.random() * 0.2);
  mistColors[idx] = color.r;
  mistColors[idx + 1] = color.g;
  mistColors[idx + 2] = color.b;
}

const mistGeometry = new THREE.BufferGeometry();
mistGeometry.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
mistGeometry.setAttribute('color', new THREE.BufferAttribute(mistColors, 3));

const mistMaterial = new THREE.ShaderMaterial({
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
      float lift = exp(-mouseDist * 8.8);
      p.x += sin(uTime * 0.2 + position.z * 1.4) * 0.018;
      p.z += cos(uTime * 0.18 + position.x * 1.3) * 0.018;
      p.y += sin(uTime * 0.34 + position.x * 1.8 + position.z * 0.8) * 0.018;
      p.y += lift * 0.2;
      vAlpha = 0.24 + lift * 0.4;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (13.0 + lift * 16.0) / -mvPosition.z;
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

const mist = new THREE.Points(mistGeometry, mistMaterial);
scene.add(mist);

const plantGroup = new THREE.Group();
scene.add(plantGroup);

function addBladeCluster(uv, count, color) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
  });
  for (let i = 0; i < count; i++) {
    const x = tileX(uv.x + (Math.random() - 0.5) * 0.06);
    const z = tileZ(uv.y + (Math.random() - 0.5) * 0.06);
    const h = 0.08 + Math.random() * 0.18;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.28, z),
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.07, -0.28 + h, z + (Math.random() - 0.5) * 0.07),
    ]);
    const blade = new THREE.Line(geometry, material.clone());
    blade.material.opacity = 0.18 + Math.random() * 0.3;
    blade.userData.phase = Math.random() * Math.PI * 2;
    blade.userData.baseOpacity = blade.material.opacity;
    plantGroup.add(blade);
  }
}

for (let i = 0; i < 24; i++) {
  addBladeCluster(sampleWater(0.34), 6 + Math.floor(Math.random() * 7), i % 3 === 0 ? 0x7fc681 : 0x9abf70);
}

function addReedCluster(uv, count) {
  for (let i = 0; i < count; i++) {
    const offsetUv = new THREE.Vector2(
      uv.x + (Math.random() - 0.5) * 0.065,
      uv.y + (Math.random() - 0.5) * 0.065,
    );
  const material = new THREE.LineBasicMaterial({
      color: i % 4 === 0 ? 0x9cd7a2 : 0x6f9d62,
    transparent: true,
      opacity: 0.44,
    blending: THREE.AdditiveBlending,
  });
    const x = tileX(offsetUv.x);
    const z = tileZ(offsetUv.y);
    const h = 0.18 + Math.random() * 0.34;
  const reed = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.28, z),
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.06, -0.28 + h, z + (Math.random() - 0.5) * 0.06),
    ]),
    material,
  );
  reed.userData.phase = Math.random() * Math.PI * 2;
  reed.userData.baseOpacity = material.opacity;
  plantGroup.add(reed);
  }
}

for (let i = 0; i < 16; i++) {
  addReedCluster(sampleWater(0.28), 4 + Math.floor(Math.random() * 5));
}

const mossGroup = new THREE.Group();
scene.add(mossGroup);

for (let i = 0; i < 18; i++) {
  const uv = sampleWater(0.46);
  const material = new THREE.MeshBasicMaterial({
    color: i % 2 ? 0x6fa45f : 0x8caa63,
    transparent: true,
    opacity: 0.09 + Math.random() * 0.07,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.12 + Math.random() * 0.18, 36), material);
  patch.position.set(tileX(uv.x), -0.272 + i * 0.001, tileZ(uv.y));
  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = Math.random() * Math.PI;
  patch.scale.y = 0.42 + Math.random() * 0.32;
  patch.userData.phase = Math.random() * Math.PI * 2;
  patch.userData.baseOpacity = material.opacity;
  mossGroup.add(patch);
}

const stoneGroup = new THREE.Group();
scene.add(stoneGroup);

const stoneColors = [0x2d2a22, 0x493829, 0x5c5548, 0x23332d];
for (let i = 0; i < 34; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: stoneColors[i % stoneColors.length],
    transparent: true,
    opacity: 0.62,
  });
  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018 + Math.random() * 0.042, 0), material);
  const uv = Math.random() < 0.65 ? sampleWater(0.52) : new THREE.Vector2(Math.random(), Math.random());
  stone.position.set(tileX(uv.x), -0.25 + Math.random() * 0.03, tileZ(uv.y));
  stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  stone.scale.y = 0.28 + Math.random() * 0.5;
  stoneGroup.add(stone);
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
        float alpha = smoothstep(0.30, 0.78, d) * 0.68;
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
  mistMaterial.uniforms.uTime.value = elapsed;
  mistMaterial.uniforms.uMouse.value.copy(smoothPointer);

  waterRibbon.material.opacity = 0.08 + (Math.sin(elapsed * 0.6) * 0.5 + 0.5) * 0.07;
  mist.rotation.y = Math.sin(elapsed * 0.055) * 0.04;
  mist.position.y = Math.sin(elapsed * 0.28) * 0.016;

  poolGroup.children.forEach((pool, i) => {
    const pulse = Math.sin(elapsed * 0.48 + pool.userData.phase) * 0.5 + 0.5;
    pool.material.opacity = pool.userData.baseOpacity + pulse * 0.04;
    pool.scale.x = 1.0 + pulse * 0.025;
  });

  plantGroup.children.forEach((plant, i) => {
    plant.rotation.z = Math.sin(elapsed * 0.52 + plant.userData.phase) * 0.016;
    plant.material.opacity = plant.userData.baseOpacity * (0.76 + (Math.sin(elapsed * 0.38 + i) * 0.5 + 0.5) * 0.26);
  });

  mossGroup.children.forEach((patch, i) => {
    const pulse = Math.sin(elapsed * 0.42 + patch.userData.phase) * 0.5 + 0.5;
    patch.material.opacity = patch.userData.baseOpacity + pulse * 0.03;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();


