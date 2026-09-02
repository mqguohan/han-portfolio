import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Hybrid';

const CLOSEUP_BG = 0x211621;
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(CLOSEUP_BG, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#211621';
canvas.style.display = 'block';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.background = '#211621';

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLOSEUP_BG);
scene.fog = new THREE.FogExp2(CLOSEUP_BG, 0.075);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.25, 2.95, 5.05);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.18;
controls.enablePan = false;
controls.minDistance = 3.45;
controls.maxDistance = 8.2;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.16, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xffe4f0, 0x211621, 1.75));

const rim = new THREE.DirectionalLight(0xffddb8, 2.05);
rim.position.set(-3.8, 5.6, 2.8);
scene.add(rim);

[
  [0x7fffe0, 4.8, -1.45, 0.95, -1.25],
  [0xff7bac, 4.2, 1.55, 1.0, 1.1],
  [0xef6f3c, 3.7, -0.7, 1.25, 1.55],
  [0xc7ddff, 3.2, 1.05, 1.5, -1.65],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.2);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);

function tileX(uvX) {
  return (uvX - 0.5) * 4;
}

function tileZ(uvY) {
  return (uvY - 0.5) * 4;
}

function hybridPathX(t) {
  return 0.48 + Math.sin((t - 0.1) * Math.PI * 2.0) * 0.22 + Math.sin(t * Math.PI * 5.0 + 0.4) * 0.035;
}

function sampleAlongHybridPath(spread = 0.12) {
  const t = 0.08 + Math.random() * 0.84;
  const x = hybridPathX(t) + (Math.random() - 0.5) * spread;
  return new THREE.Vector2(THREE.MathUtils.clamp(x, 0.06, 0.94), t);
}

const zoneCenters = {
  bio: [
    new THREE.Vector2(0.24, 0.36),
    new THREE.Vector2(0.64, 0.68),
    new THREE.Vector2(0.80, 0.34),
  ],
  mineral: [
    new THREE.Vector2(0.67, 0.29),
    new THREE.Vector2(0.44, 0.18),
    new THREE.Vector2(0.74, 0.53),
  ],
  toxic: [
    new THREE.Vector2(0.33, 0.70),
    new THREE.Vector2(0.50, 0.52),
  ],
  ghost: [
    new THREE.Vector2(0.18, 0.78),
    new THREE.Vector2(0.74, 0.78),
  ],
};

const tileUniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
};

const terrain = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 260, 260),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vBio;
      varying float vMineral;
      varying float vToxic;
      varying float vWet;
      varying float vGhost;
      varying float vRidge;
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

      float blob(vec2 uv, vec2 center, float radius) {
        vec2 d = (uv - center) * vec2(1.0, 1.26);
        return smoothstep(radius, 0.0, length(d));
      }

      float pathX(float y) {
        return 0.48 + sin((y - 0.1) * 6.2831853) * 0.22 + sin(y * 15.707963 + 0.4) * 0.035;
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;

        float broad = fbm(p * 1.38 + vec2(0.0, uTime * 0.003));
        float patchNoise = fbm(p * 3.15 + vec2(5.2, -2.4));
        float fine = fbm(p * 6.1 - vec2(uTime * 0.01, 0.0));
        float ridgeLine = sin((p.x * 3.7 + p.y * 2.0) + fbm(p * 2.2) * 5.4);

        vBio = clamp(
          blob(uv, vec2(0.24, 0.36), 0.34) * 0.85 +
          blob(uv, vec2(0.64, 0.68), 0.31) * 0.72 +
          blob(uv, vec2(0.80, 0.34), 0.22) * 0.42 +
          smoothstep(0.62, 0.88, patchNoise) * 0.28,
          0.0, 1.0
        );

        vMineral = clamp(
          blob(uv, vec2(0.67, 0.29), 0.36) * 0.86 +
          blob(uv, vec2(0.44, 0.18), 0.26) * 0.52 +
          blob(uv, vec2(0.74, 0.53), 0.24) * 0.48 +
          smoothstep(0.57, 0.86, fbm(p * 4.4 + 8.0)) * 0.3,
          0.0, 1.0
        );

        vToxic = clamp(
          blob(uv, vec2(0.33, 0.70), 0.26) * 0.72 +
          blob(uv, vec2(0.50, 0.52), 0.20) * 0.48 +
          smoothstep(0.72, 0.91, fbm(p * 5.4 - 4.0)) * 0.18,
          0.0, 1.0
        );

        float waterDist = abs(uv.x - pathX(uv.y));
        vWet = clamp(smoothstep(0.13, 0.0, waterDist) + smoothstep(0.72, 0.93, fbm(p * 3.6 + vec2(-1.5, 4.0))) * 0.28, 0.0, 1.0);

        float verticalSurvey = 1.0 - smoothstep(0.0, 0.028, abs(fract(uv.x * 7.0 + 0.18) - 0.5));
        float horizontalSurvey = 1.0 - smoothstep(0.0, 0.025, abs(fract(uv.y * 5.0 + 0.31) - 0.5));
        vGhost = clamp(max(verticalSurvey, horizontalSurvey) * 0.46 + blob(uv, vec2(0.18, 0.78), 0.22) * 0.45 + blob(uv, vec2(0.74, 0.78), 0.20) * 0.35, 0.0, 1.0);
        vRidge = smoothstep(0.86, 0.99, abs(ridgeLine));

        float mouseDist = distance(uv, uMouse);
        float pulse = exp(-mouseDist * 9.8) * (0.58 + 0.42 * sin(mouseDist * 34.0 - uTime * 3.0));

        vHeight = broad * 0.54 + patchNoise * 0.36 + fine * 0.10;
        vec3 transformed = position;
        transformed.z =
          (broad - 0.5) * 0.18 +
          (patchNoise - 0.5) * 0.10 +
          (fine - 0.5) * 0.035 +
          vBio * 0.045 +
          vMineral * 0.055 -
          vToxic * 0.055 -
          vWet * 0.035 +
          vRidge * 0.045 +
          pulse * 0.04;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vBio;
      varying float vMineral;
      varying float vToxic;
      varying float vWet;
      varying float vGhost;
      varying float vRidge;
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

      float pathX(float y) {
        return 0.48 + sin((y - 0.1) * 6.2831853) * 0.22 + sin(y * 15.707963 + 0.4) * 0.035;
      }

      void main() {
        vec3 plum = vec3(0.129, 0.086, 0.129);
        vec3 earthDark = vec3(0.30, 0.22, 0.17);
        vec3 earthLight = vec3(0.70, 0.56, 0.40);
        vec3 softGreen = vec3(0.34, 0.60, 0.28);
        vec3 bloomGreen = vec3(0.58, 0.88, 0.38);
        vec3 rust = vec3(0.88, 0.37, 0.12);
        vec3 ochre = vec3(0.95, 0.62, 0.28);
        vec3 wetMint = vec3(0.28, 0.92, 0.78);
        vec3 ghostBlue = vec3(0.74, 0.86, 1.0);
        vec3 toxicViolet = vec3(0.34, 0.10, 0.37);
        vec3 pink = vec3(1.0, 0.45, 0.68);

        float edgeFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, vUv.y)
          * smoothstep(0.0, 0.05, 1.0 - vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.y);
        float shade = smoothstep(0.10, 0.86, vHeight);
        float grain = noise(vUv * 86.0 + vec2(uTime * 0.006, 0.0));
        float matNoise = noise(vUv * 22.0 + vec2(2.0, -4.0));
        float waterDist = abs(vUv.x - pathX(vUv.y));
        float wetLine = smoothstep(0.10, 0.0, waterDist);
        float wetBank = smoothstep(0.24, 0.0, waterDist);
        float bioFleck = step(0.955, hash(floor(vUv * 150.0))) * smoothstep(0.36, 1.0, vBio);
        float mineralFleck = step(0.965, hash(floor(vUv * 125.0 + 19.0))) * smoothstep(0.34, 1.0, vMineral);
        float smear = smoothstep(0.48, 0.80, noise(vUv * vec2(18.0, 7.0) + vec2(0.0, uTime * 0.012))) * vToxic;

        vec3 color = mix(earthDark, earthLight, shade * 0.72 + matNoise * 0.16);
        color = mix(color, softGreen, smoothstep(0.14, 0.92, vBio) * 0.46);
        color += bloomGreen * smoothstep(0.48, 1.0, vBio) * 0.18;
        color = mix(color, rust, smoothstep(0.12, 0.92, vMineral) * 0.50);
        color += ochre * vMineral * 0.12;
        color = mix(color, toxicViolet, smoothstep(0.20, 0.95, vToxic) * 0.34);
        color += wetMint * wetLine * 0.42;
        color += wetMint * wetBank * 0.13;
        color = mix(color, ghostBlue, smoothstep(0.22, 1.0, vGhost) * 0.22);
        color += ghostBlue * smoothstep(0.55, 1.0, vGhost) * 0.09;
        color += pink * bioFleck * 0.32;
        color += ochre * mineralFleck * 0.30;
        color += toxicViolet * smear * 0.16;
        color += vec3(0.12, 0.09, 0.08) * vRidge;
        color += vec3(grain - 0.5) * 0.08;
        color = mix(plum, color, max(edgeFade, 0.30));
        color = pow(color, vec3(0.86));

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -0.36;
scene.add(terrain);

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0xfce7f0,
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
  edge.position.set(x, -0.302, z);
  edge.rotation.x = -Math.PI / 2;
  scene.add(edge);
});

const surfaceGroup = new THREE.Group();
scene.add(surfaceGroup);

function addSurfaceDisk(uv, radius, color, opacity, scaleY = 0.55) {
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  disk.position.set(tileX(uv.x), -0.285 + Math.random() * 0.025, tileZ(uv.y));
  disk.rotation.x = -Math.PI / 2;
  disk.rotation.z = Math.random() * Math.PI;
  disk.scale.y = scaleY;
  disk.userData.phase = Math.random() * Math.PI * 2;
  disk.userData.baseOpacity = opacity;
  surfaceGroup.add(disk);
}

zoneCenters.bio.forEach((uv, i) => addSurfaceDisk(uv, 0.30 + i * 0.045, i % 2 ? 0x9dff76 : 0x6bd36b, 0.10, 0.50));
zoneCenters.mineral.forEach((uv, i) => addSurfaceDisk(uv, 0.24 + i * 0.04, i % 2 ? 0xffa04a : 0xef6f3c, 0.12, 0.44));
zoneCenters.toxic.forEach((uv, i) => addSurfaceDisk(uv, 0.25 + i * 0.035, i % 2 ? 0x9c5bb0 : 0x5f3a68, 0.11, 0.46));
zoneCenters.ghost.forEach((uv, i) => addSurfaceDisk(uv, 0.22 + i * 0.03, 0xc7ddff, 0.08, 0.34));

const waterPoints = [];
for (let i = 0; i < 76; i++) {
  const t = i / 75;
  waterPoints.push(new THREE.Vector3(tileX(hybridPathX(t)), -0.276, tileZ(t)));
}

const waterRibbon = new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(waterPoints), 170, 0.022, 8, false),
  new THREE.MeshBasicMaterial({
    color: 0x7fffe0,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(waterRibbon);

const detailGroup = new THREE.Group();
scene.add(detailGroup);

function addLine(points, color, opacity, radius = 0.004) {
  const curve = new THREE.CatmullRomCurve3(points);
  const line = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, radius, 5, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  detailGroup.add(line);
}

for (let i = 0; i < 28; i++) {
  const uv = i % 3 === 0 ? sampleAlongHybridPath(0.42) : new THREE.Vector2(Math.random(), Math.random());
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const angle = Math.random() * Math.PI * 2;
  const length = 0.12 + Math.random() * 0.28;
  addLine(
    [
      new THREE.Vector3(x, -0.245, z),
      new THREE.Vector3(x + Math.cos(angle) * length, -0.242, z + Math.sin(angle) * length),
    ],
    i % 4 === 0 ? 0xc7ddff : i % 4 === 1 ? 0xff7bac : i % 4 === 2 ? 0xef6f3c : 0x7fffe0,
    0.12 + Math.random() * 0.11,
    0.003 + Math.random() * 0.004,
  );
}

const fleckCount = 480;
const fleckPositions = new Float32Array(fleckCount * 3);
const fleckColors = new Float32Array(fleckCount * 3);
const fleckPalette = [
  new THREE.Color(0xff7bac),
  new THREE.Color(0x7fffe0),
  new THREE.Color(0xef6f3c),
  new THREE.Color(0xc7ddff),
  new THREE.Color(0xfce7f0),
  new THREE.Color(0xa4e66d),
];

for (let i = 0; i < fleckCount; i++) {
  const uv = Math.random() < 0.52 ? sampleAlongHybridPath(0.52) : new THREE.Vector2(Math.random(), Math.random());
  const idx = i * 3;
  fleckPositions[idx] = tileX(THREE.MathUtils.clamp(uv.x + (Math.random() - 0.5) * 0.12, 0.03, 0.97));
  fleckPositions[idx + 1] = -0.19 + Math.pow(Math.random(), 2.2) * 0.55;
  fleckPositions[idx + 2] = tileZ(THREE.MathUtils.clamp(uv.y + (Math.random() - 0.5) * 0.10, 0.03, 0.97));

  const color = fleckPalette[Math.floor(Math.random() * fleckPalette.length)].clone();
  color.lerp(new THREE.Color(0xffffff), Math.random() * 0.16);
  fleckColors[idx] = color.r;
  fleckColors[idx + 1] = color.g;
  fleckColors[idx + 2] = color.b;
}

const fleckGeometry = new THREE.BufferGeometry();
fleckGeometry.setAttribute('position', new THREE.BufferAttribute(fleckPositions, 3));
fleckGeometry.setAttribute('color', new THREE.BufferAttribute(fleckColors, 3));

const fleckMaterial = new THREE.ShaderMaterial({
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
      p.x += sin(uTime * 0.19 + position.z * 1.5) * 0.012;
      p.z += cos(uTime * 0.17 + position.x * 1.4) * 0.012;
      p.y += sin(uTime * 0.34 + position.x * 1.7 + position.z * 0.8) * 0.014;
      p.y += lift * 0.14;
      vAlpha = 0.20 + lift * 0.32;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (11.0 + lift * 12.0) / -mvPosition.z;
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

const flecks = new THREE.Points(fleckGeometry, fleckMaterial);
scene.add(flecks);

const surveyGroup = new THREE.Group();
scene.add(surveyGroup);
const surveyMaterial = new THREE.LineBasicMaterial({
  color: 0xd9c8ff,
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
});

for (let i = 0; i < 7; i++) {
  const x = -1.7 + i * 0.56;
  const survey = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.20, -1.85),
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.18, -0.04 + Math.random() * 0.25, 1.85),
    ]),
    surveyMaterial.clone(),
  );
  survey.userData.phase = i * 0.5;
  survey.userData.baseOpacity = 0.08 + Math.random() * 0.10;
  surveyGroup.add(survey);
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
        float alpha = smoothstep(0.42, 0.86, d) * 0.34;
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
  fleckMaterial.uniforms.uTime.value = elapsed;
  fleckMaterial.uniforms.uMouse.value.copy(smoothPointer);

  waterRibbon.material.opacity = 0.18 + (Math.sin(elapsed * 0.62) * 0.5 + 0.5) * 0.12;
  flecks.rotation.y = Math.sin(elapsed * 0.055) * 0.035;
  flecks.position.y = Math.sin(elapsed * 0.24) * 0.015;

  surfaceGroup.children.forEach((disk, i) => {
    const pulse = Math.sin(elapsed * 0.5 + disk.userData.phase) * 0.5 + 0.5;
    disk.material.opacity = disk.userData.baseOpacity + pulse * 0.035;
    disk.scale.x = 1.0 + pulse * 0.025;
  });

  detailGroup.children.forEach((line, i) => {
    line.material.opacity = 0.09 + (Math.sin(elapsed * 0.48 + i) * 0.5 + 0.5) * 0.10;
  });

  surveyGroup.children.forEach((line, i) => {
    line.material.opacity = line.userData.baseOpacity + (Math.sin(elapsed * 0.38 + line.userData.phase) * 0.5 + 0.5) * 0.045;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
