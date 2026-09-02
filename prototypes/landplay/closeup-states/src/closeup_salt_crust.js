import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Salt Crust';

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
controls.target.set(0, -0.13, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xfff0ce, 0x111018, 1.24);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0xffe6bd, 2.1);
rim.position.set(-3.7, 5.5, 2.7);
scene.add(rim);

[
  [0xffd9a2, 4.4, 1.6, 0.8, 1.1],
  [0xcfeaff, 3.4, -1.5, 1.0, -1.4],
  [0xd7b3ce, 2.5, -0.2, 1.6, 1.5],
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
  new THREE.PlaneGeometry(4, 4, 240, 240),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vCrust;
      varying float vCrack;
      varying float vRing;
      varying float vSparkle;
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
          p *= 2.04;
          amp *= 0.48;
        }
        return value;
      }

      float polygonCrack(vec2 uv) {
        vec2 cell = uv * 7.0;
        vec2 f = fract(cell) - 0.5;
        float lineA = 1.0 - smoothstep(0.21, 0.27, abs(f.x + f.y * 0.34));
        float lineB = 1.0 - smoothstep(0.22, 0.28, abs(f.y - f.x * 0.28));
        float lineC = 1.0 - smoothstep(0.20, 0.26, abs(f.x - f.y * 0.7));
        return max(max(lineA, lineB), lineC) * smoothstep(0.18, 0.82, fbm(uv * 2.1 + 4.0));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.35 + vec2(0.0, uTime * 0.002));
        float mineral = fbm(p * 4.2 + vec2(6.0, -2.0));
        float basin = smoothstep(1.12, 0.08, length(p * vec2(0.82, 1.05)));

        vCrack = polygonCrack(uv);
        vCrust = smoothstep(0.42, 0.78, mineral) * 0.72 + smoothstep(0.25, 0.94, basin) * 0.28;

        float ringA = 1.0 - smoothstep(0.016, 0.055, abs(fract((length(p * vec2(0.88, 1.14)) + broad * 0.035) * 6.4) - 0.5));
        float ringB = 1.0 - smoothstep(0.012, 0.045, abs(fract((distance(uv, vec2(0.35, 0.68)) + mineral * 0.026) * 5.6) - 0.5));
        vRing = max(ringA * 0.58, ringB * 0.42);

        vSparkle = smoothstep(0.76, 0.96, noise(uv * 92.0 + vec2(uTime * 0.01, 0.0))) * vCrust;

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 11.0) * (0.66 + 0.34 * sin(mouseDist * 40.0 - uTime * 3.4));

        float basinSink = basin * 0.055;
        float subtleRelief = (broad - 0.5) * 0.055 + (mineral - 0.5) * 0.026;
        float raisedEdges = vCrack * 0.03 + vRing * 0.018 + vCrust * 0.012;

        vHeight = broad * 0.55 + mineral * 0.45;
        vec3 transformed = position;
        transformed.z = subtleRelief - basinSink + raisedEdges + vPulse * 0.026;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vCrust;
      varying float vCrack;
      varying float vRing;
      varying float vSparkle;
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
        vec3 warmGround = vec3(0.48, 0.45, 0.38);
        vec3 beige = vec3(0.70, 0.67, 0.57);
        vec3 salt = vec3(0.88, 0.86, 0.76);
        vec3 residue = vec3(0.72, 0.71, 0.62);
        vec3 blueSheen = vec3(0.55, 0.78, 0.92);
        vec3 violetShadow = vec3(0.28, 0.23, 0.34);
        vec3 crackDark = vec3(0.075, 0.065, 0.058);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.13, 0.86, vHeight);
        float grain = noise(vUv * 110.0) * 0.055;
        float mineralNoise = noise(vUv * 23.0 + vec2(2.0, -3.0));
        float glint = step(0.975, hash(floor(vUv * 160.0))) * vCrust;
        float slowSheen = sin(uTime * 0.36 + vUv.x * 6.0 - vUv.y * 3.0) * 0.5 + 0.5;

        vec3 color = mix(warmGround, beige, shade);
        color = mix(color, residue, smoothstep(0.36, 0.82, mineralNoise) * 0.26);
        color = mix(color, salt, vCrust * 0.72);
        color = mix(color, violetShadow, (1.0 - shade) * 0.16);
        color = mix(color, crackDark, clamp(vCrack * 0.55, 0.0, 0.65));
        color += salt * vRing * 0.18;
        color += blueSheen * vSparkle * (0.12 + slowSheen * 0.10);
        color += blueSheen * glint * 0.22;
        color += salt * vPulse * 0.16;
        color += blueSheen * vPulse * vCrack * 0.07;
        color += grain;
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
  color: 0xd8c29a,
  transparent: true,
  opacity: 0.14,
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

const crustPlateGroup = new THREE.Group();
scene.add(crustPlateGroup);

const plateColors = [0xd8ccb2, 0xbfb28d, 0xe2d8bd, 0xcfc28f];
for (let i = 0; i < 30; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: plateColors[i % plateColors.length],
    transparent: true,
    opacity: 0.18 + Math.random() * 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sides = 5 + Math.floor(Math.random() * 3);
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.11 + Math.random() * 0.2, sides), material);
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.72) * 1.8;
  plate.position.set(Math.cos(angle) * radius, -0.275 + Math.random() * 0.018, Math.sin(angle) * radius);
  plate.rotation.x = -Math.PI / 2;
  plate.rotation.z = Math.random() * Math.PI;
  plate.scale.y = 0.5 + Math.random() * 0.4;
  plate.userData.phase = Math.random() * Math.PI * 2;
  plate.userData.baseOpacity = material.opacity;
  crustPlateGroup.add(plate);
}

const crackGroup = new THREE.Group();
scene.add(crackGroup);

function makePaleCrack(points, opacity) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 42, 0.004, 5, false),
    new THREE.MeshBasicMaterial({
      color: 0xe4d9bf,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  crackGroup.add(mesh);
}

for (let i = 0; i < 24; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 1.85;
  const start = new THREE.Vector3(Math.cos(angle) * radius, -0.25, Math.sin(angle) * radius);
  const points = [start];
  for (let j = 1; j < 5; j++) {
    const bend = angle + (Math.random() - 0.5) * 0.95;
    const length = j * (0.09 + Math.random() * 0.07);
    points.push(new THREE.Vector3(start.x + Math.cos(bend) * length, -0.248, start.z + Math.sin(bend) * length));
  }
  makePaleCrack(points, 0.12 + Math.random() * 0.16);
}

const ringGroup = new THREE.Group();
scene.add(ringGroup);

for (let i = 0; i < 7; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34 + i * 0.22, 0.345 + i * 0.22, 96),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xe6d6ad : 0x9ab2c1,
      transparent: true,
      opacity: 0.052,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.position.y = -0.258 + i * 0.002;
  ring.rotation.x = -Math.PI / 2;
  ring.scale.y = 0.72 + i * 0.025;
  ring.userData.phase = i * 0.5;
  ringGroup.add(ring);
}

const dustCount = 560;
const dustPositions = new Float32Array(dustCount * 3);
const dustColors = new Float32Array(dustCount * 3);
const dustPalette = [
  new THREE.Color(0xe7ddc6),
  new THREE.Color(0xcfc29f),
  new THREE.Color(0xf0e5cf),
  new THREE.Color(0xaec8d9),
];

for (let i = 0; i < dustCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.78) * 2.08;
  const idx = i * 3;
  dustPositions[idx] = Math.cos(angle) * radius;
  dustPositions[idx + 1] = -0.2 + Math.pow(Math.random(), 2.4) * 0.68;
  dustPositions[idx + 2] = Math.sin(angle) * radius;

  const color = dustPalette[Math.floor(Math.random() * dustPalette.length)].clone();
  color.lerp(new THREE.Color(0xfff3dc), Math.random() * 0.18);
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
      float lift = exp(-mouseDist * 9.8);
      p.x += sin(uTime * 0.16 + position.z * 1.1) * 0.014;
      p.z += cos(uTime * 0.13 + position.x * 1.0) * 0.014;
      p.y += sin(uTime * 0.22 + position.x * 1.6 + position.z) * 0.01;
      p.y += lift * 0.18;
      vAlpha = 0.24 + lift * 0.38;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (10.0 + lift * 15.0) / -mvPosition.z;
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

const mineralGroup = new THREE.Group();
scene.add(mineralGroup);

const mineralColors = [0xd8ccb2, 0xaaa489, 0xb9cddd, 0x8f806d];
for (let i = 0; i < 44; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: mineralColors[i % mineralColors.length],
    transparent: true,
    opacity: 0.68,
  });
  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.015 + Math.random() * 0.038, 0), material);
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 1.92;
  stone.position.set(Math.cos(angle) * radius, -0.245 + Math.random() * 0.025, Math.sin(angle) * radius);
  stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  stone.scale.y = 0.25 + Math.random() * 0.45;
  mineralGroup.add(stone);
}

for (let i = 0; i < 16; i++) {
  const cluster = new THREE.Group();
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 1.75;
  cluster.position.set(Math.cos(angle) * radius, -0.235, Math.sin(angle) * radius);
  for (let j = 0; j < 4; j++) {
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.016 + Math.random() * 0.015, 0.05 + Math.random() * 0.08, 5),
      new THREE.MeshBasicMaterial({
        color: j % 2 ? 0xe4d8bd : 0xb8d0dc,
        transparent: true,
        opacity: 0.62,
      }),
    );
    crystal.position.set((Math.random() - 0.5) * 0.08, Math.random() * 0.035, (Math.random() - 0.5) * 0.08);
    crystal.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
    cluster.add(crystal);
  }
  mineralGroup.add(cluster);
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

  dust.rotation.y = Math.sin(elapsed * 0.04) * 0.025;
  dust.position.y = Math.sin(elapsed * 0.2) * 0.008;

  crustPlateGroup.children.forEach((plate, i) => {
    const pulse = Math.sin(elapsed * 0.24 + plate.userData.phase) * 0.5 + 0.5;
    plate.material.opacity = plate.userData.baseOpacity + pulse * 0.035;
    plate.rotation.z += 0.00018 + i * 0.00001;
  });

  ringGroup.children.forEach((ring, i) => {
    const pulse = Math.sin(elapsed * 0.28 + ring.userData.phase) * 0.5 + 0.5;
    ring.material.opacity = 0.035 + pulse * 0.04;
    ring.rotation.z += 0.00035 + i * 0.00003;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();



