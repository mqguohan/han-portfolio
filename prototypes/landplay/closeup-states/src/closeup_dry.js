import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Dry Layer';

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
scene.fog = new THREE.FogExp2(0x211621, 0.16);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.35, 2.85, 5.15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
controls.enablePan = false;
controls.minDistance = 3.8;
controls.maxDistance = 8.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.12, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xf6dcc0, 0x161015, 1.25);
scene.add(ambient);

const dryRim = new THREE.DirectionalLight(0xffd5a0, 2.0);
dryRim.position.set(-3.8, 5.4, 2.8);
scene.add(dryRim);

[
  [0xffb46e, 4.8, 1.8, 0.9, 1.0],
  [0xd8b28e, 3.6, -1.4, 1.1, -1.6],
  [0x7f6b88, 2.8, -0.3, 1.7, 1.5],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.5);
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
      varying float vCrack;
      varying float vBasin;
      varying float vDust;
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
          p *= 2.02;
          amp *= 0.48;
        }
        return value;
      }

      float crackLine(float value, float width) {
        return 1.0 - smoothstep(0.0, width, abs(fract(value) - 0.5));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.55 + vec2(0.0, uTime * 0.003));
        float fine = fbm(p * 4.8 + vec2(8.0, -2.0));
        float basin = smoothstep(1.05, 0.05, length(p * vec2(0.82, 1.05)));
        vBasin = basin;

        float crackA = crackLine((uv.x * 1.2 + uv.y * 0.42 + fine * 0.11) * 8.0, 0.032);
        float crackB = crackLine((uv.y * 1.3 - uv.x * 0.3 + broad * 0.12) * 7.0, 0.026);
        float crackMask = smoothstep(0.36, 0.74, fbm(p * 2.7 + vec2(4.0, 11.0)));
        vCrack = max(crackA * 0.62, crackB * 0.46) * crackMask;

        float rings = 1.0 - smoothstep(0.015, 0.055, abs(fract((length(p * vec2(0.9, 1.12)) + broad * 0.04) * 6.0) - 0.5));
        vDust = smoothstep(0.3, 0.86, fine) * 0.45 + rings * 0.28;

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 11.0) * (0.65 + 0.35 * sin(mouseDist * 38.0 - uTime * 3.8));

        float basinSink = basin * 0.09;
        float ridges = vCrack * 0.018 + rings * 0.02;
        float surface = (broad - 0.5) * 0.105 + (fine - 0.5) * 0.035;

        vHeight = broad * 0.62 + fine * 0.38;
        vec3 transformed = position;
        transformed.z = surface - basinSink + ridges + vPulse * 0.035;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vCrack;
      varying float vBasin;
      varying float vDust;
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

      void main() {
        vec3 greyBrown = vec3(0.24, 0.20, 0.17);
        vec3 ochre = vec3(0.56, 0.40, 0.20);
        vec3 sand = vec3(0.74, 0.62, 0.44);
        vec3 paleSand = vec3(0.88, 0.78, 0.58);
        vec3 orangeDust = vec3(0.95, 0.48, 0.16);
        vec3 violetShadow = vec3(0.19, 0.16, 0.24);
        vec3 crackDark = vec3(0.045, 0.035, 0.035);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.12, 0.84, vHeight);
        float grain = noise(vUv * 95.0) * 0.07;
        float mineral = noise(vUv * 22.0 + vec2(2.0, -3.0));
        float oldRing = 1.0 - smoothstep(0.015, 0.06, abs(fract((distance(vUv, vec2(0.52, 0.48)) + mineral * 0.025) * 7.0) - 0.5));
        float lowPulse = sin(uTime * 0.42 + vUv.x * 4.0 + vUv.y * 2.0) * 0.5 + 0.5;

        vec3 color = mix(greyBrown, sand, shade);
        color = mix(color, ochre, smoothstep(0.42, 0.85, mineral) * 0.32);
        color = mix(color, paleSand, vDust * 0.32);
        color = mix(color, violetShadow, vBasin * 0.18);
        color = mix(color, crackDark, clamp(vCrack * 0.82, 0.0, 0.85));
        color += paleSand * oldRing * 0.10;
        color += orangeDust * smoothstep(0.58, 0.95, mineral) * 0.08;
        color += paleSand * vPulse * 0.20;
        color += orangeDust * vPulse * vCrack * 0.11;
        color += grain;
        color = mix(vec3(0.129, 0.086, 0.129), color, edgeFade);
        color *= 0.88 + lowPulse * 0.04;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.38;
scene.add(tile);

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0xd6a46c,
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
  edge.position.set(x, -0.34, z);
  edge.rotation.x = -Math.PI / 2;
  scene.add(edge);
});

const crackGroup = new THREE.Group();
scene.add(crackGroup);

function makeCrack(points, opacity, color = 0x18110d) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 48, 0.004, 5, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.MultiplyBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  crackGroup.add(mesh);
  return mesh;
}

for (let i = 0; i < 18; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 1.65;
  const start = new THREE.Vector3(Math.cos(angle) * radius, -0.28, Math.sin(angle) * radius);
  const points = [start];
  for (let j = 1; j < 5; j++) {
    const bend = angle + (Math.random() - 0.5) * 0.9;
    const length = j * (0.11 + Math.random() * 0.08);
    points.push(new THREE.Vector3(start.x + Math.cos(bend) * length, -0.275, start.z + Math.sin(bend) * length));
  }
  makeCrack(points, 0.26 + Math.random() * 0.24);
}

const dustCount = 680;
const dustPositions = new Float32Array(dustCount * 3);
const dustColors = new Float32Array(dustCount * 3);
const dustPalette = [
  new THREE.Color(0xe9c993),
  new THREE.Color(0xcfa66e),
  new THREE.Color(0xf3dcc1),
  new THREE.Color(0xb88b5c),
];

for (let i = 0; i < dustCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.85) * 2.18;
  const idx = i * 3;
  dustPositions[idx] = Math.cos(angle) * radius;
  dustPositions[idx + 1] = -0.18 + Math.pow(Math.random(), 2.3) * 0.85;
  dustPositions[idx + 2] = Math.sin(angle) * radius;

  const color = dustPalette[Math.floor(Math.random() * dustPalette.length)].clone();
  color.lerp(new THREE.Color(0xffead0), Math.random() * 0.22);
  dustColors[idx] = color.r;
  dustColors[idx + 1] = color.g;
  dustColors[idx + 2] = color.b;
}

const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

const dustMaterial = new THREE.ShaderMaterial({
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
      float lift = exp(-mouseDist * 9.5);
      p.x += sin(uTime * 0.22 + position.z * 1.3) * 0.025;
      p.z += cos(uTime * 0.18 + position.x * 1.1) * 0.025;
      p.y += sin(uTime * 0.35 + position.x * 1.8 + position.z) * 0.018;
      p.y += lift * 0.26;
      vAlpha = 0.24 + lift * 0.42;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (12.0 + lift * 18.0) / -mvPosition.z;
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

const dust = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dust);

const detailGroup = new THREE.Group();
scene.add(detailGroup);

const stoneColors = [0x8f7357, 0xb08a5a, 0x6e635b, 0xc0a276];
for (let i = 0; i < 46; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: stoneColors[i % stoneColors.length],
    transparent: true,
    opacity: 0.62,
  });
  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018 + Math.random() * 0.045, 0), material);
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 1.95;
  stone.position.set(Math.cos(angle) * radius, -0.255 + Math.random() * 0.03, Math.sin(angle) * radius);
  stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  stone.scale.y = 0.35 + Math.random() * 0.5;
  detailGroup.add(stone);
}

function addStem(x, z, height, color = 0x8e6f4c) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, -0.27, z),
    new THREE.Vector3(x + (Math.random() - 0.5) * 0.08, -0.27 + height, z + (Math.random() - 0.5) * 0.08),
  ]);
  const stem = new THREE.Line(geometry, material);
  stem.userData.phase = Math.random() * Math.PI * 2;
  stem.userData.baseOpacity = material.opacity;
  detailGroup.add(stem);
}

for (let i = 0; i < 32; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.5 + Math.random() * 1.55;
  addStem(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.06 + Math.random() * 0.22, i % 4 === 0 ? 0xb18a58 : 0x705f4f);
}

for (let i = 0; i < 3; i++) {
  const curvePoints = [];
  const baseAngle = i * 2.1 + 0.3;
  const x = Math.cos(baseAngle) * (0.75 + i * 0.32);
  const z = Math.sin(baseAngle) * (0.7 + i * 0.28);
  for (let j = 0; j < 24; j++) {
    const a = j / 23 * Math.PI * 1.55;
    curvePoints.push(new THREE.Vector3(x + Math.cos(a) * 0.16, -0.22 + j * 0.006, z + Math.sin(a) * 0.08));
  }
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const curl = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, 0.006, 5, false),
    new THREE.MeshBasicMaterial({
      color: 0x9d744b,
      transparent: true,
      opacity: 0.46,
    }),
  );
  detailGroup.add(curl);
}

const basinRingGroup = new THREE.Group();
scene.add(basinRingGroup);

for (let i = 0; i < 6; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35 + i * 0.22, 0.354 + i * 0.22, 96),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xcaa36f : 0x7e6d82,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.position.y = -0.263 + i * 0.002;
  ring.rotation.x = -Math.PI / 2;
  ring.scale.y = 0.72 + i * 0.03;
  ring.userData.phase = i * 0.6;
  basinRingGroup.add(ring);
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
  dustMaterial.uniforms.uTime.value = elapsed;
  dustMaterial.uniforms.uMouse.value.copy(smoothPointer);

  dust.rotation.y = Math.sin(elapsed * 0.055) * 0.035;
  dust.position.y = Math.sin(elapsed * 0.25) * 0.012;

  detailGroup.children.forEach((item, i) => {
    if (item.isLine) {
      item.rotation.z = Math.sin(elapsed * 0.55 + item.userData.phase) * 0.012;
      item.material.opacity = item.userData.baseOpacity * (0.72 + (Math.sin(elapsed * 0.4 + i) * 0.5 + 0.5) * 0.26);
    }
  });

  basinRingGroup.children.forEach((ring, i) => {
    const pulse = Math.sin(elapsed * 0.32 + ring.userData.phase) * 0.5 + 0.5;
    ring.material.opacity = 0.035 + pulse * 0.04;
    ring.rotation.z += 0.00045 + i * 0.00004;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();



