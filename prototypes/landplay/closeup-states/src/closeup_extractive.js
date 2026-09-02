import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Extractive Wound';

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
camera.position.set(4.45, 3.05, 5.15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
controls.enablePan = false;
controls.minDistance = 3.8;
controls.maxDistance = 8.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.16, 0);
controls.update();

const ambient = new THREE.HemisphereLight(0xffd9a6, 0x100c0a, 1.2);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0xffbd76, 2.0);
rim.position.set(-3.8, 5.8, 2.7);
scene.add(rim);

[
  [0xff8f3d, 4.8, 1.7, 0.9, 0.8],
  [0xd7aa72, 4.1, -1.6, 1.0, -1.4],
  [0x52463f, 2.9, 0.0, 1.5, 1.6],
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
  new THREE.PlaneGeometry(4, 4, 250, 250),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vPit;
      varying float vTerrace;
      varying float vMineral;
      varying float vScrape;
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

      float stripe(float value, float width) {
        return 1.0 - smoothstep(0.0, width, abs(fract(value) - 0.5));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        vec2 pitP = p - vec2(0.06, -0.04);
        float pitDist = length(pitP * vec2(1.0, 0.78));
        float broad = fbm(p * 1.45 + vec2(0.0, uTime * 0.002));
        float cutNoise = fbm(p * 3.2 + vec2(4.0, -9.0));
        float fine = fbm(p * 6.0 + vec2(12.0, 2.0));

        float pitCore = smoothstep(0.62, 0.16, pitDist);
        float pitWall = smoothstep(0.92, 0.34, pitDist);
        vPit = pitCore;

        float terraces = stripe(pitDist * 5.2 + cutNoise * 0.16, 0.06) * smoothstep(0.78, 0.22, pitDist);
        vTerrace = terraces;

        float mineralA = stripe((p.x * 0.28 + p.y * 0.72 + cutNoise * 0.12) * 8.0, 0.045);
        float mineralB = stripe((p.x * 0.9 - p.y * 0.22 + fine * 0.1) * 6.0, 0.038);
        vMineral = max(mineralA * 0.72, mineralB * 0.48) * (pitWall + smoothstep(0.58, 0.86, cutNoise) * 0.4);

        float scrapeA = stripe((uv.x * 0.8 + uv.y * 0.18 + fine * 0.08) * 14.0, 0.026);
        float scrapeB = stripe((uv.y * 0.9 - uv.x * 0.16 + broad * 0.06) * 10.0, 0.022);
        vScrape = max(scrapeA * 0.44, scrapeB * 0.32) * smoothstep(0.26, 0.78, cutNoise);

        float mouseDist = distance(uv, uMouse);
        vPulse = exp(-mouseDist * 10.8) * (0.62 + 0.38 * sin(mouseDist * 38.0 - uTime * 3.5));

        float base = (broad - 0.5) * 0.12 + (cutNoise - 0.5) * 0.075 + (fine - 0.5) * 0.02;
        float openPit = pitCore * 0.42 + pitWall * 0.14;
        float raisedCuts = terraces * 0.05 + vScrape * 0.018;

        vHeight = broad * 0.55 + cutNoise * 0.45;
        vec3 transformed = position;
        transformed.z = base - openPit + raisedCuts + vPulse * 0.035;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vPit;
      varying float vTerrace;
      varying float vMineral;
      varying float vScrape;
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
        vec3 darkSoil = vec3(0.12, 0.07, 0.04);
        vec3 brown = vec3(0.28, 0.16, 0.08);
        vec3 ochre = vec3(0.58, 0.36, 0.13);
        vec3 rust = vec3(0.75, 0.22, 0.08);
        vec3 mineralRed = vec3(0.45, 0.09, 0.055);
        vec3 ore = vec3(0.035, 0.032, 0.03);
        vec3 dustyEdge = vec3(0.74, 0.58, 0.36);
        vec3 amber = vec3(1.0, 0.55, 0.16);

        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);
        float shade = smoothstep(0.13, 0.86, vHeight);
        float grit = noise(vUv * 100.0) * 0.06;
        float stain = noise(vUv * 18.0 + vec2(2.0, -4.0));
        float seamPulse = sin(uTime * 0.55 + vUv.x * 5.0 + vUv.y * 2.0) * 0.5 + 0.5;

        vec3 color = mix(darkSoil, brown, shade);
        color = mix(color, ochre, smoothstep(0.35, 0.82, stain) * 0.38);
        color = mix(color, ore, clamp(vPit * 0.92, 0.0, 0.94));
        color = mix(color, dustyEdge, vTerrace * 0.34);
        color += rust * vMineral * 0.22;
        color += mineralRed * smoothstep(0.35, 1.0, vMineral) * 0.24;
        color += dustyEdge * vScrape * 0.14;
        color += amber * vMineral * (0.06 + seamPulse * 0.05);
        color += amber * vPulse * vMineral * 0.14;
        color += dustyEdge * vPulse * vScrape * 0.08;
        color += grit;
        color = mix(vec3(0.129, 0.086, 0.129), color, edgeFade);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.36;
scene.add(tile);

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0xc5894f,
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
  edge.position.set(x, -0.332, z);
  edge.rotation.x = -Math.PI / 2;
  scene.add(edge);
});

const ringGroup = new THREE.Group();
scene.add(ringGroup);

for (let i = 0; i < 6; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32 + i * 0.16, 0.326 + i * 0.16, 96),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xd18942 : 0x312722,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.position.set(0.12, -0.255 + i * 0.004, -0.08);
  ring.rotation.x = -Math.PI / 2;
  ring.scale.y = 0.7;
  ring.userData.phase = i * 0.55;
  ringGroup.add(ring);
}

const detailGroup = new THREE.Group();
scene.add(detailGroup);

function addScrape(points, opacity, color = 0xd7a061) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 36, 0.004, 5, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  detailGroup.add(mesh);
}

for (let i = 0; i < 34; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.25 + Math.random() * 1.75;
  const start = new THREE.Vector3(Math.cos(angle) * radius, -0.242, Math.sin(angle) * radius);
  const direction = angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.7;
  const points = [start];
  for (let j = 1; j < 4; j++) {
    const length = j * (0.12 + Math.random() * 0.1);
    points.push(new THREE.Vector3(start.x + Math.cos(direction) * length, -0.24, start.z + Math.sin(direction) * length));
  }
  addScrape(points, 0.11 + Math.random() * 0.16, i % 4 === 0 ? 0x2a211d : 0xc58743);
}

const rockColors = [0x211b18, 0x4b2618, 0x7a3b1c, 0x9b5b24, 0x2f2b27];
for (let i = 0; i < 62; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: rockColors[i % rockColors.length],
    transparent: true,
    opacity: 0.74,
  });
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02 + Math.random() * 0.065, 0), material);
  const aroundPit = Math.random() < 0.72;
  const angle = Math.random() * Math.PI * 2;
  const radius = aroundPit ? 0.42 + Math.random() * 0.9 : Math.random() * 1.95;
  rock.position.set(Math.cos(angle) * radius + 0.12, -0.22 + Math.random() * 0.06, Math.sin(angle) * radius - 0.08);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.scale.y = 0.35 + Math.random() * 0.7;
  detailGroup.add(rock);
}

for (let i = 0; i < 11; i++) {
  const pile = new THREE.Group();
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.6 + Math.random() * 1.15;
  pile.position.set(Math.cos(angle) * radius + 0.12, -0.23, Math.sin(angle) * radius - 0.08);
  for (let j = 0; j < 7; j++) {
    const stone = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.025 + Math.random() * 0.05, 0),
      new THREE.MeshBasicMaterial({
        color: rockColors[(i + j) % rockColors.length],
        transparent: true,
        opacity: 0.76,
      }),
    );
    stone.position.set((Math.random() - 0.5) * 0.18, Math.random() * 0.08, (Math.random() - 0.5) * 0.18);
    stone.scale.y = 0.45 + Math.random() * 0.7;
    pile.add(stone);
  }
  detailGroup.add(pile);
}

const plateGroup = new THREE.Group();
scene.add(plateGroup);

for (let i = 0; i < 12; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: i % 2 ? 0x8a4a22 : 0x3a3029,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.16 + Math.random() * 0.22, 5), material);
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.7 + Math.random() * 1.3;
  plate.position.set(Math.cos(angle) * radius, -0.205 + Math.random() * 0.05, Math.sin(angle) * radius);
  plate.rotation.set(-Math.PI / 2 + (Math.random() - 0.5) * 0.35, Math.random() * Math.PI, Math.random() * Math.PI);
  plate.scale.y = 0.48 + Math.random() * 0.35;
  plate.userData.phase = Math.random() * Math.PI * 2;
  plateGroup.add(plate);
}

const markerGroup = new THREE.Group();
scene.add(markerGroup);

for (let i = 0; i < 9; i++) {
  const group = new THREE.Group();
  const stakeMaterial = new THREE.LineBasicMaterial({
    color: 0xd8b77c,
    transparent: true,
    opacity: 0.55,
  });
  const stake = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.28 + Math.random() * 0.16, 0)]),
    stakeMaterial,
  );
  group.add(stake);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.04),
    new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xffb15b : 0x6b5648,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(0.04, 0.23, 0);
  group.add(flag);

  const angle = Math.random() * Math.PI * 2;
  const radius = 1.0 + Math.random() * 1.1;
  group.position.set(Math.cos(angle) * radius, -0.24, Math.sin(angle) * radius);
  group.rotation.y = Math.random() * Math.PI;
  group.userData.phase = Math.random() * Math.PI * 2;
  markerGroup.add(group);
}

const dustCount = 720;
const dustPositions = new Float32Array(dustCount * 3);
const dustColors = new Float32Array(dustCount * 3);
const dustPalette = [
  new THREE.Color(0xd7a46b),
  new THREE.Color(0xb65c28),
  new THREE.Color(0xf0c287),
  new THREE.Color(0xa59a8c),
  new THREE.Color(0xffb151),
];

for (let i = 0; i < dustCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.75) * 2.15;
  const idx = i * 3;
  dustPositions[idx] = Math.cos(angle) * radius;
  dustPositions[idx + 1] = -0.12 + Math.pow(Math.random(), 2.1) * 0.95;
  dustPositions[idx + 2] = Math.sin(angle) * radius;

  const color = dustPalette[Math.floor(Math.random() * dustPalette.length)].clone();
  color.lerp(new THREE.Color(0xffd8a8), Math.random() * 0.18);
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
      float lift = exp(-mouseDist * 9.2);
      p.x += sin(uTime * 0.2 + position.z * 1.3) * 0.021;
      p.z += cos(uTime * 0.17 + position.x * 1.1) * 0.021;
      p.y += sin(uTime * 0.32 + position.x * 1.7 + position.z) * 0.014;
      p.y += lift * 0.22;
      vAlpha = 0.24 + lift * 0.42;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (12.0 + lift * 17.0) / -mvPosition.z;
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

  dust.rotation.y = Math.sin(elapsed * 0.05) * 0.035;
  dust.position.y = Math.sin(elapsed * 0.25) * 0.012;

  ringGroup.children.forEach((ring, i) => {
    const pulse = Math.sin(elapsed * 0.34 + ring.userData.phase) * 0.5 + 0.5;
    ring.material.opacity = 0.045 + pulse * 0.07;
    ring.rotation.z += 0.0005 + i * 0.00004;
  });

  plateGroup.children.forEach((plate, i) => {
    plate.rotation.z += 0.00035 + i * 0.00002;
  });

  markerGroup.children.forEach((marker, i) => {
    marker.rotation.z = Math.sin(elapsed * 0.45 + marker.userData.phase) * 0.018;
    marker.position.y = -0.24 + Math.sin(elapsed * 0.35 + i) * 0.003;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();



