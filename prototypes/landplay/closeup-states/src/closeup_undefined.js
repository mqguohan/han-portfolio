import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Undefined';

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
scene.fog = new THREE.FogExp2(CLOSEUP_BG, 0.17);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.2, 3.05, 5.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.18;
controls.enablePan = false;
controls.minDistance = 3.7;
controls.maxDistance = 8.4;
controls.maxPolarAngle = Math.PI * 0.5;
controls.target.set(0, -0.06, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xfff7f9, 0x211621, 1.65));
const rim = new THREE.DirectionalLight(0xf5dbe7, 2.0);
rim.position.set(-3.8, 5.8, 2.8);
scene.add(rim);
const coolFill = new THREE.DirectionalLight(0xc7ddff, 0.85);
coolFill.position.set(3.8, 2.1, -3.2);
scene.add(coolFill);

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
      varying float vMissing;
      varying float vSample;
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
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.48; }
        return v;
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.35 + vec2(0.0, uTime * 0.004));
        float lowInfo = fbm(p * 2.9 + vec2(8.0, -3.5));
        float block = noise(floor(uv * vec2(12.0, 8.0)) * 0.71 + vec2(3.0, 11.0));
        vMissing = smoothstep(0.58, 0.82, lowInfo) * (0.55 + smoothstep(0.52, 0.82, block) * 0.45);
        vSample = smoothstep(0.44, 0.55, abs(fract(uv.y * 15.0 + block * 0.06) - 0.5));

        float mouseDist = distance(uv, uMouse);
        float readPulse = exp(-mouseDist * 9.0) * sin(mouseDist * 22.0 - uTime * 2.1) * 0.014;
        vHeight = broad * 0.62 + lowInfo * 0.18;

        vec3 transformed = position;
        transformed.z = (broad - 0.5) * 0.11 + (lowInfo - 0.5) * 0.028 - vMissing * 0.035 + readPulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vMissing;
      varying float vSample;
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
        vec3 pale = vec3(0.91, 0.88, 0.86);
        vec3 warmWhite = vec3(0.96, 0.92, 0.90);
        vec3 dustPink = vec3(0.82, 0.68, 0.71);
        vec3 coolGrey = vec3(0.66, 0.70, 0.72);
        vec3 blueTrace = vec3(0.70, 0.79, 0.92);

        float shade = smoothstep(0.14, 0.82, vHeight);
        float grain = noise(vUv * 90.0 + uTime * 0.01) * 0.055;
        float block = noise(floor(vUv * vec2(16.0, 10.0)) + vec2(2.0, 9.0));
        float strip = smoothstep(0.955, 0.985, vSample) * 0.22;
        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);

        vec3 color = mix(coolGrey, pale, shade * 0.68 + 0.24);
        color = mix(color, warmWhite, smoothstep(0.30, 0.78, block) * 0.22);
        color = mix(color, dustPink, (1.0 - shade) * 0.16);
        color = mix(color, blueTrace, strip);
        color = mix(color, plum, vMissing * 0.30);
        color += grain;
        color = mix(plum, color, edgeFade);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.35;
scene.add(tile);

const fragmentGroup = new THREE.Group();
scene.add(fragmentGroup);
const lineMat = new THREE.MeshBasicMaterial({ color: 0xf4d9e4, transparent: true, opacity: 0.22, depthWrite: false });
for (let i = 0; i < 18; i++) {
  const w = 0.18 + Math.random() * 0.75;
  const h = 0.006 + Math.random() * 0.008;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
  strip.position.set((Math.random() - 0.5) * 3.55, -0.285 + Math.random() * 0.08, (Math.random() - 0.5) * 3.4);
  strip.rotation.x = -Math.PI / 2;
  strip.rotation.z = (Math.random() - 0.5) * 0.12;
  fragmentGroup.add(strip);
}

const particleCount = 120;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 4.0;
  positions[i * 3 + 1] = -0.05 + Math.random() * 0.7;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
}
const particles = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
  new THREE.PointsMaterial({ color: 0xf4e7ee, size: 0.012, transparent: true, opacity: 0.28, depthWrite: false })
);
scene.add(particles);

const vignette = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)); float alpha = smoothstep(0.32, 0.78, d) * 0.62; gl_FragColor = vec4(0.129, 0.086, 0.129, alpha); }`,
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
  fragmentGroup.children.forEach((child, i) => {
    child.material.opacity = 0.12 + Math.sin(time * 0.45 + i) * 0.035 + 0.08;
  });
  particles.rotation.y = Math.sin(time * 0.08) * 0.05;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
