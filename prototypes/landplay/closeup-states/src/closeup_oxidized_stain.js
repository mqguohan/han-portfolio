import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Oxidized Stain';

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
scene.fog = new THREE.FogExp2(CLOSEUP_BG, 0.155);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.35, 3.0, 5.15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.21;
controls.enablePan = false;
controls.minDistance = 3.7;
controls.maxDistance = 8.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.08, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xffd8b8, 0x211621, 1.35));
const rim = new THREE.DirectionalLight(0xffa356, 2.3);
rim.position.set(-3.9, 5.8, 2.7);
scene.add(rim);
const redFill = new THREE.PointLight(0xef6f3c, 5.4, 7.0);
redFill.position.set(1.6, 1.1, 1.4);
scene.add(redFill);
const goldFill = new THREE.PointLight(0xffc36e, 3.8, 6.0);
goldFill.position.set(-1.4, 0.85, -1.7);
scene.add(goldFill);

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
      varying float vStain;
      varying float vVein;
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
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 1.96; a *= 0.48; }
        return v;
      }
      float stainBlob(vec2 uv, vec2 c, float r) {
        vec2 d = (uv - c) * vec2(1.0, 1.35);
        return smoothstep(r, 0.0, length(d));
      }

      void main() {
        vUv = uv;
        vec2 p = uv * 2.0 - 1.0;
        float broad = fbm(p * 1.45 + vec2(0.0, uTime * 0.003));
        float granular = fbm(p * 4.1 + vec2(5.5, -2.0));
        float veinField = sin((p.x * 5.4 + p.y * 2.7) + fbm(p * 2.0) * 5.5);

        float stains = 0.0;
        stains += stainBlob(uv, vec2(0.30, 0.34), 0.34) * 0.85;
        stains += stainBlob(uv, vec2(0.63, 0.56), 0.40) * 0.95;
        stains += stainBlob(uv, vec2(0.70, 0.26), 0.23) * 0.48;
        stains += smoothstep(0.48, 0.82, granular) * 0.34;
        vStain = clamp(stains, 0.0, 1.0);
        vVein = smoothstep(0.92, 0.99, abs(veinField));

        float mouseDist = distance(uv, uMouse);
        float pulse = exp(-mouseDist * 9.5) * 0.032;
        vHeight = broad * 0.62 + granular * 0.38;
        vec3 transformed = position;
        transformed.z = (broad - 0.5) * 0.12 + (granular - 0.5) * 0.05 + vStain * 0.035 + vVein * 0.045 + pulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      varying float vStain;
      varying float vVein;
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
        vec3 mineralBase = vec3(0.47, 0.31, 0.20);
        vec3 ochre = vec3(0.74, 0.43, 0.15);
        vec3 rust = vec3(0.86, 0.24, 0.08);
        vec3 ironDark = vec3(0.36, 0.10, 0.055);
        vec3 saltDust = vec3(0.86, 0.70, 0.48);
        vec3 hotEdge = vec3(1.0, 0.56, 0.20);

        float shade = smoothstep(0.12, 0.84, vHeight);
        float grain = noise(vUv * 82.0 + vec2(uTime * 0.006, 0.0));
        float speckle = step(0.955, hash(floor(vUv * 145.0))) * smoothstep(0.18, 1.0, vStain);
        float stainEdge = smoothstep(0.18, 0.72, vStain) * (1.0 - smoothstep(0.74, 0.96, vStain));
        float edgeFade = smoothstep(0.0, 0.055, vUv.x) * smoothstep(0.0, 0.055, vUv.y)
          * smoothstep(0.0, 0.055, 1.0 - vUv.x) * smoothstep(0.0, 0.055, 1.0 - vUv.y);

        vec3 color = mix(mineralBase, ochre, shade * 0.55 + grain * 0.25);
        color = mix(color, rust, vStain * 0.58);
        color = mix(color, ironDark, smoothstep(0.70, 1.0, vStain) * 0.28);
        color += hotEdge * stainEdge * 0.18;
        color += saltDust * (1.0 - vStain) * (1.0 - shade) * 0.13;
        color += hotEdge * vVein * 0.38;
        color += vec3(1.0, 0.72, 0.35) * speckle * 0.30;
        color += (grain - 0.5) * 0.075;
        color = mix(plum, color, edgeFade);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.36;
scene.add(tile);

const veinGroup = new THREE.Group();
scene.add(veinGroup);
const veinMat = new THREE.MeshBasicMaterial({ color: 0xffa04a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
for (let i = 0; i < 26; i++) {
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.18 + Math.random() * 0.82, 0.008 + Math.random() * 0.016), veinMat);
  bar.position.set((Math.random() - 0.5) * 3.3, -0.265 + Math.random() * 0.13, (Math.random() - 0.5) * 3.35);
  bar.rotation.x = -Math.PI / 2;
  bar.rotation.z = -0.55 + Math.random() * 1.1;
  veinGroup.add(bar);
}

const particleCount = 180;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 3.8;
  positions[i * 3 + 1] = -0.12 + Math.random() * 0.75;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 3.8;
}
const particles = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
  new THREE.PointsMaterial({ color: 0xffa15c, size: 0.016, transparent: true, opacity: 0.32, depthWrite: false })
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
  veinGroup.children.forEach((child, i) => {
    child.material.opacity = 0.15 + Math.sin(time * 0.5 + i * 0.7) * 0.035 + 0.07;
  });
  particles.rotation.y = time * 0.035;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
