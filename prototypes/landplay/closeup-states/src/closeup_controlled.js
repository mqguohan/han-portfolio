import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Controlled';

const CLOSEUP_BG = 0x211621;
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
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

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLOSEUP_BG);
scene.fog = new THREE.FogExp2(CLOSEUP_BG, 0.16);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.3, 3.15, 5.1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.16;
controls.enablePan = false;
controls.minDistance = 3.7;
controls.maxDistance = 8.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.06, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xf8fbff, 0x211621, 1.55));
const rim = new THREE.DirectionalLight(0xdff2ff, 2.1);
rim.position.set(-3.6, 5.8, 2.7);
scene.add(rim);
const surveyGlow = new THREE.PointLight(0xfce7f0, 3.0, 6.4);
surveyGlow.position.set(1.5, 1.0, 1.4);
scene.add(surveyGlow);

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);
const tileUniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
};

const tile = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 220, 220),
  new THREE.ShaderMaterial({
    uniforms: tileUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vGrid;
      varying float vBoundary;
      uniform float uTime;
      uniform vec2 uMouse;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 1.95; a *= 0.48; }
        return v;
      }
      float gridLine(float v, float width) {
        return 1.0 - smoothstep(0.0, width, abs(fract(v) - 0.5));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float terrain = fbm(p * 1.65 + vec2(0.0, uTime * 0.002));
        float fine = fbm(p * 4.5 + vec2(8.0, -1.0));
        float gridA = max(gridLine(uv.x * 7.0, 0.055), gridLine(uv.y * 7.0, 0.055));
        float gridB = max(gridLine(uv.x * 3.5 + 0.12, 0.025), gridLine(uv.y * 3.5 - 0.08, 0.025));
        vGrid = max(gridA * 0.55, gridB);
        vBoundary = smoothstep(0.035, 0.0, abs(uv.x - 0.18)) + smoothstep(0.035, 0.0, abs(uv.x - 0.82))
          + smoothstep(0.035, 0.0, abs(uv.y - 0.22)) + smoothstep(0.035, 0.0, abs(uv.y - 0.78));
        vBoundary = clamp(vBoundary, 0.0, 1.0);

        float mouseDist = distance(uv, uMouse);
        float surveyPulse = exp(-mouseDist * 10.0) * 0.024;
        vHeight = terrain * 0.66 + fine * 0.24;
        vec3 transformed = position;
        transformed.z = (terrain - 0.5) * 0.10 + (fine - 0.5) * 0.018 + vGrid * 0.012 + vBoundary * 0.026 + surveyPulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vGrid;
      varying float vBoundary;
      uniform float uTime;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.7, 289.1))) * 97143.231); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec3 plum = vec3(0.129, 0.086, 0.129);
        vec3 ground = vec3(0.64, 0.67, 0.66);
        vec3 pale = vec3(0.85, 0.88, 0.88);
        vec3 blueGrey = vec3(0.62, 0.72, 0.78);
        vec3 pinkLine = vec3(0.95, 0.74, 0.84);
        vec3 whiteLine = vec3(0.96, 0.98, 1.0);

        float shade = smoothstep(0.13, 0.84, vHeight);
        float grain = noise(vUv * 78.0) * 0.05;
        float tick = step(0.965, hash(floor(vUv * vec2(32.0, 18.0)))) * vGrid;
        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);

        vec3 color = mix(ground, pale, shade * 0.58 + 0.20);
        color = mix(color, blueGrey, (1.0 - shade) * 0.16);
        color += grain;
        color = mix(color, whiteLine, vGrid * 0.42);
        color = mix(color, pinkLine, vBoundary * 0.58);
        color += whiteLine * tick * 0.20;
        color = mix(plum, color, edgeFade);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.36;
scene.add(tile);

const surveyGroup = new THREE.Group();
scene.add(surveyGroup);
const lineMat = new THREE.MeshBasicMaterial({ color: 0xfce7f0, transparent: true, opacity: 0.30, depthWrite: false });
const accentMat = new THREE.MeshBasicMaterial({ color: 0xb8cee8, transparent: true, opacity: 0.20, depthWrite: false });

function addBar(x, z, w, h, mat, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, -0.275, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rot;
  surveyGroup.add(mesh);
}

for (let i = -2; i <= 2; i++) {
  addBar(i * 0.72, 0, 0.008, 3.65, lineMat);
  addBar(0, i * 0.72, 3.65, 0.008, lineMat);
}
[
  [-1.42, -1.42], [1.42, -1.42], [-1.42, 1.42], [1.42, 1.42],
  [-0.42, 0.72], [0.78, -0.56], [0.18, 0.08],
].forEach(([x, z]) => {
  addBar(x, z, 0.28, 0.012, accentMat);
  addBar(x, z, 0.012, 0.28, accentMat);
});

const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24, depthWrite: false });
for (let i = 0; i < 7; i++) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.11 + i * 0.015, 0.112 + i * 0.015, 64), ringMat);
  ring.position.set((Math.random() - 0.5) * 2.6, -0.268 + i * 0.0004, (Math.random() - 0.5) * 2.5);
  ring.rotation.x = -Math.PI / 2;
  surveyGroup.add(ring);
}

const vignette = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)); float alpha = smoothstep(0.32, 0.78, d) * 0.58; gl_FragColor = vec4(0.129, 0.086, 0.129, alpha); }`,
  }),
);
vignette.renderOrder = 10;
scene.add(vignette);

window.addEventListener('pointermove', event => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = 1 - event.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate(now = 0) {
  const time = now * 0.001;
  smoothPointer.lerp(pointer, 0.06);
  tileUniforms.uTime.value = time;
  tileUniforms.uMouse.value.copy(smoothPointer);
  surveyGroup.children.forEach((child, i) => {
    if (!child.material) return;
    child.material.opacity = (child.geometry.type === 'RingGeometry' ? 0.16 : 0.20) + Math.sin(time * 0.42 + i * 0.31) * 0.035;
  });
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
