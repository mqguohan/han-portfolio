import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Toxic Runoff';

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
scene.fog = new THREE.FogExp2(0x211621, 0.17);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.35, 2.95, 5.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.22;
controls.enablePan = false;
controls.minDistance = 3.8;
controls.maxDistance = 8.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.1, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xa8ffca, 0x120718, 1.2);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0xc098ff, 1.9);
rim.position.set(-3.9, 5.6, 2.8);
scene.add(rim);

[
  [0x72ff68, 5.0, -1.25, 0.82, -1.25],
  [0xff4fc7, 4.8, 1.6, 1.05, 0.9],
  [0x4eeeff, 4.0, 0.95, 0.7, -1.6],
  [0x5b2cff, 3.8, -1.8, 1.4, 1.4],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.5);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);

function sCurveX(t) {
  return 0.5 + Math.sin((t - 0.04) * Math.PI * 2.0) * 0.23 + Math.sin(t * Math.PI * 4.0 + 1.1) * 0.04;
}

function tileX(uvX) {
  return (uvX - 0.5) * 4;
}

function tileZ(uvY) {
  return (uvY - 0.5) * 4;
}

function sampleRunoff(spread = 0.11) {
  const t = 0.07 + Math.random() * 0.86;
  const x = sCurveX(t) + (Math.random() - 0.5) * spread;
  return new THREE.Vector2(THREE.MathUtils.clamp(x, 0.06, 0.94), t);
}

const poolCenters = [
  new THREE.Vector2(sCurveX(0.2) - 0.07, 0.2),
  new THREE.Vector2(sCurveX(0.38) + 0.08, 0.38),
  new THREE.Vector2(sCurveX(0.55) - 0.08, 0.55),
  new THREE.Vector2(sCurveX(0.74) + 0.05, 0.74),
  new THREE.Vector2(0.22, 0.68),
  new THREE.Vector2(0.78, 0.28),
];

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
      varying float vRunoff;
      varying float vPool;
      varying float vStain;
      varying float vIridescence;
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
          p *= 1.98;
          amp *= 0.48;
        }
        return value;
      }

      float sPathX(float y) {
        return 0.5 + sin((y - 0.04) * 6.2831853) * 0.23 + sin(y * 12.56637 + 1.1) * 0.04;
      }

      float pool(vec2 uv, vec2 center, float radius) {
        vec2 d = (uv - center) * vec2(1.0, 1.35);
        return smoothstep(radius, 0.0, length(d));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.55 + vec2(0.0, uTime * 0.004));
        float mud = fbm(p * 3.2 + vec2(7.0, -4.0));
        float fine = fbm(p * 6.0 - vec2(uTime * 0.012, 0.0));

        float pathX = sPathX(uv.y);
        float runoffDist = abs(uv.x - pathX);
        float runoffCore = smoothstep(0.105, 0.0, runoffDist);
        float runoffHalo = smoothstep(0.255, 0.0, runoffDist);
        vRunoff = runoffCore;

        float pools = 0.0;
        pools += pool(uv, vec2(sPathX(0.2) - 0.07, 0.2), 0.22);
        pools += pool(uv, vec2(sPathX(0.38) + 0.08, 0.38), 0.26);
        pools += pool(uv, vec2(sPathX(0.55) - 0.08, 0.55), 0.3);
        pools += pool(uv, vec2(sPathX(0.74) + 0.05, 0.74), 0.23);
        pools += pool(uv, vec2(0.22, 0.68), 0.2) * 0.62;
        pools += pool(uv, vec2(0.78, 0.28), 0.2) * 0.58;
        vPool = clamp(pools, 0.0, 1.0);

        vStain = clamp(runoffHalo * 0.48 + smoothstep(0.43, 0.8, mud) * 0.48 + vPool * 0.35, 0.0, 1.0);
        vIridescence = smoothstep(0.56, 0.86, fine) * (runoffHalo + vPool * 0.65);

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 10.5) * (0.6 + 0.4 * sin(mouseDist * 34.0 - uTime * 3.4));

        float lowTerrain = (broad - 0.5) * 0.105 + (mud - 0.5) * 0.075 + (fine - 0.5) * 0.018;
        float wetSink = runoffCore * 0.075 + vPool * 0.09;
        float swollenMud = vStain * 0.026;

        vHeight = broad * 0.58 + mud * 0.42;
        vec3 transformed = position;
        transformed.z = lowTerrain - wetSink + swollenMud + vPulse * 0.04;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vRunoff;
      varying float vPool;
      varying float vStain;
      varying float vIridescence;
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
        return 0.5 + sin((y - 0.04) * 6.2831853) * 0.23 + sin(y * 12.56637 + 1.1) * 0.04;
      }

      void main() {
        vec3 blackViolet = vec3(0.025, 0.014, 0.035);
        vec3 darkMud = vec3(0.085, 0.055, 0.045);
        vec3 rustyBrown = vec3(0.30, 0.14, 0.07);
        vec3 toxicGreen = vec3(0.28, 0.88, 0.20);
        vec3 runoffPurple = vec3(0.19, 0.04, 0.29);
        vec3 oilyCyan = vec3(0.08, 0.88, 0.96);
        vec3 oilyMagenta = vec3(1.0, 0.16, 0.72);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.12, 0.84, vHeight);
        float stainNoise = noise(vUv * 18.0 + vec2(uTime * 0.01, 0.0));
        float slickNoise = noise(vUv * 70.0 - vec2(uTime * 0.025, uTime * 0.01));
        float pathX = sPathX(vUv.y);
        float runoffDist = abs(vUv.x - pathX);
        float runoffLine = smoothstep(0.085, 0.0, runoffDist);
        float runoffBank = smoothstep(0.23, 0.0, runoffDist);
        float ripple = sin((vUv.x + vUv.y) * 42.0 + stainNoise * 7.0 - uTime * 1.6) * 0.5 + 0.5;
        float oily = smoothstep(0.48, 0.86, slickNoise) * (vRunoff + vPool * 0.8);

        vec3 color = mix(darkMud, rustyBrown, shade * 0.45 + stainNoise * 0.22);
        color = mix(color, blackViolet, clamp(vPool * 0.85 + vRunoff * 0.56, 0.0, 0.92));
        color = mix(color, runoffPurple, runoffBank * 0.42 + vStain * 0.26);
        color += toxicGreen * smoothstep(0.48, 0.9, vStain) * 0.13;
        color += oilyCyan * oily * (0.13 + ripple * 0.12);
        color += oilyMagenta * oily * (0.12 + (1.0 - ripple) * 0.1);
        color += toxicGreen * runoffLine * 0.1;
        color += oilyCyan * vPulse * (vRunoff + vPool) * 0.18;
        color += oilyMagenta * vPulse * smoothstep(0.4, 1.0, vStain) * 0.11;
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
  color: 0x654477,
  transparent: true,
  opacity: 0.16,
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

const runoffPoints = [];
for (let i = 0; i < 80; i++) {
  const t = i / 79;
  runoffPoints.push(new THREE.Vector3(tileX(sCurveX(t)), -0.295, tileZ(t)));
}

const runoffCurve = new THREE.CatmullRomCurve3(runoffPoints);
const runoffRibbon = new THREE.Mesh(
  new THREE.TubeGeometry(runoffCurve, 170, 0.026, 9, false),
  new THREE.MeshBasicMaterial({
    color: 0x40ff7e,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(runoffRibbon);

const poolGroup = new THREE.Group();
scene.add(poolGroup);

poolCenters.forEach((center, i) => {
  const material = new THREE.MeshBasicMaterial({
    color: i % 2 ? 0x7d1aa0 : 0x101015,
    transparent: true,
    opacity: i % 2 ? 0.17 : 0.26,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.26 + Math.random() * 0.18, 72), material);
  disk.position.set(tileX(center.x), -0.286 + i * 0.004, tileZ(center.y));
  disk.rotation.x = -Math.PI / 2;
  disk.scale.set(1.0 + Math.random() * 0.45, 0.42 + Math.random() * 0.25, 1);
  disk.rotation.z = Math.random() * Math.PI;
  disk.userData.phase = i * 0.62;
  disk.userData.baseOpacity = material.opacity;
  poolGroup.add(disk);
});

const vaporCount = 980;
const vaporPositions = new Float32Array(vaporCount * 3);
const vaporColors = new Float32Array(vaporCount * 3);
const vaporPalette = [
  new THREE.Color(0x7d33ff),
  new THREE.Color(0x5cff72),
  new THREE.Color(0x3af2ff),
  new THREE.Color(0xff46bf),
  new THREE.Color(0x9a6cff),
];

for (let i = 0; i < vaporCount; i++) {
  const nearRunoff = Math.random() < 0.82;
  const uv = nearRunoff ? sampleRunoff(0.24) : poolCenters[Math.floor(Math.random() * poolCenters.length)];
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.8) * (nearRunoff ? 0.18 : 0.26);
  const idx = i * 3;
  vaporPositions[idx] = tileX(THREE.MathUtils.clamp(uv.x + Math.cos(angle) * radius, 0.03, 0.97));
  vaporPositions[idx + 1] = -0.08 + Math.pow(Math.random(), 1.7) * 1.05;
  vaporPositions[idx + 2] = tileZ(THREE.MathUtils.clamp(uv.y + Math.sin(angle) * radius * 0.7, 0.03, 0.97));

  const color = vaporPalette[Math.floor(Math.random() * vaporPalette.length)].clone();
  color.lerp(new THREE.Color(0xf2d8ff), Math.random() * 0.18);
  vaporColors[idx] = color.r;
  vaporColors[idx + 1] = color.g;
  vaporColors[idx + 2] = color.b;
}

const vaporGeometry = new THREE.BufferGeometry();
vaporGeometry.setAttribute('position', new THREE.BufferAttribute(vaporPositions, 3));
vaporGeometry.setAttribute('color', new THREE.BufferAttribute(vaporColors, 3));

const vaporMaterial = new THREE.ShaderMaterial({
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
      p.x += sin(uTime * 0.26 + position.z * 1.6) * 0.024;
      p.z += cos(uTime * 0.23 + position.x * 1.4) * 0.024;
      p.y += sin(uTime * 0.42 + position.x * 1.9 + position.z * 0.8) * 0.026;
      p.y += lift * 0.22;
      p.xz += normalize((uv - uMouse) + 0.0001) * lift * 0.04;
      vAlpha = 0.25 + lift * 0.42;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (16.0 + lift * 18.0) / -mvPosition.z;
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

const vapor = new THREE.Points(vaporGeometry, vaporMaterial);
scene.add(vapor);

const detailGroup = new THREE.Group();
scene.add(detailGroup);

function addCrack(points, opacity) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 42, 0.004, 5, false),
    new THREE.MeshBasicMaterial({
      color: 0x08050a,
      transparent: true,
      opacity,
      blending: THREE.MultiplyBlending,
      depthWrite: false,
    }),
  );
  detailGroup.add(mesh);
}

for (let i = 0; i < 14; i++) {
  const uv = Math.random() < 0.7 ? sampleRunoff(0.55) : new THREE.Vector2(Math.random(), Math.random());
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const angle = Math.random() * Math.PI * 2;
  const points = [new THREE.Vector3(x, -0.272, z)];
  for (let j = 1; j < 5; j++) {
    const bend = angle + (Math.random() - 0.5) * 1.1;
    const length = j * (0.1 + Math.random() * 0.08);
    points.push(new THREE.Vector3(x + Math.cos(bend) * length, -0.27, z + Math.sin(bend) * length));
  }
  addCrack(points, 0.28 + Math.random() * 0.22);
}

const stoneColors = [0x171018, 0x332038, 0x5a3325, 0x1f2718, 0x66422e];
for (let i = 0; i < 42; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: stoneColors[i % stoneColors.length],
    transparent: true,
    opacity: 0.68,
  });
  const fragment = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018 + Math.random() * 0.045, 0), material);
  const uv = Math.random() < 0.72 ? sampleRunoff(0.45) : new THREE.Vector2(Math.random(), Math.random());
  fragment.position.set(tileX(uv.x), -0.25 + Math.random() * 0.035, tileZ(uv.y));
  fragment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  fragment.scale.y = 0.3 + Math.random() * 0.5;
  detailGroup.add(fragment);
}

function addDamagedStem(uv, height, color) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
  });
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, -0.265, z),
    new THREE.Vector3(x + (Math.random() - 0.5) * 0.08, -0.265 + height, z + (Math.random() - 0.5) * 0.08),
  ]);
  const stem = new THREE.Line(geometry, material);
  stem.userData.phase = Math.random() * Math.PI * 2;
  stem.userData.baseOpacity = material.opacity;
  detailGroup.add(stem);
}

for (let i = 0; i < 34; i++) {
  addDamagedStem(sampleRunoff(0.52), 0.06 + Math.random() * 0.28, i % 4 === 0 ? 0x6bff5d : 0x5f3d3b);
}

const filmGroup = new THREE.Group();
scene.add(filmGroup);

for (let i = 0; i < 8; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: i % 2 ? 0xff4fc7 : 0x4df4ff,
    transparent: true,
    opacity: 0.05 + Math.random() * 0.04,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.36 + Math.random() * 0.38, 0.055 + Math.random() * 0.08), material);
  const uv = sampleRunoff(0.26);
  strip.position.set(tileX(uv.x), 0.08 + Math.random() * 0.48, tileZ(uv.y));
  strip.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * Math.PI);
  strip.userData.phase = Math.random() * Math.PI * 2;
  strip.userData.baseOpacity = material.opacity;
  filmGroup.add(strip);
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
  vaporMaterial.uniforms.uTime.value = elapsed;
  vaporMaterial.uniforms.uMouse.value.copy(smoothPointer);

  runoffRibbon.material.opacity = 0.16 + (Math.sin(elapsed * 0.7) * 0.5 + 0.5) * 0.14;
  vapor.rotation.y = Math.sin(elapsed * 0.06) * 0.04;
  vapor.position.y = Math.sin(elapsed * 0.28) * 0.018;

  poolGroup.children.forEach((pool, i) => {
    const pulse = Math.sin(elapsed * 0.58 + pool.userData.phase) * 0.5 + 0.5;
    pool.material.opacity = pool.userData.baseOpacity + pulse * 0.05;
    pool.scale.x = 1.0 + pulse * 0.035;
  });

  detailGroup.children.forEach((item, i) => {
    if (item.isLine) {
      item.rotation.z = Math.sin(elapsed * 0.48 + item.userData.phase) * 0.016;
      item.material.opacity = item.userData.baseOpacity * (0.72 + (Math.sin(elapsed * 0.42 + i) * 0.5 + 0.5) * 0.3);
    }
  });

  filmGroup.children.forEach((strip, i) => {
    strip.rotation.z += 0.0007 + i * 0.00004;
    strip.position.y += Math.sin(elapsed * 0.42 + strip.userData.phase) * 0.00055;
    strip.material.opacity = strip.userData.baseOpacity + (Math.sin(elapsed * 0.65 + i) * 0.5 + 0.5) * 0.025;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();



