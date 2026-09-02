import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Early Bloom';

const BG = 0x211621;
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BG, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#211621';
canvas.style.display = 'block';
canvas.style.width = '100vw';
canvas.style.height = '100vh';

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.155);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.25, 3.02, 5.12);

const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.055,
  autoRotate: true,
  autoRotateSpeed: 0.17,
  enablePan: false,
  minDistance: 3.7,
  maxDistance: 8.4,
  maxPolarAngle: Math.PI * 0.49,
});
controls.target.set(0, -0.10, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xf4ffe4, 0x211621, 1.35));
const rim = new THREE.DirectionalLight(0xcfffb6, 1.85);
rim.position.set(-3.8, 5.7, 2.8);
scene.add(rim);
[
  [0xb8ff91, 3.2, -1.2, 0.9, 1.0],
  [0xff9fc4, 2.5, 1.3, 0.9, -1.1],
  [0x7fffe0, 2.0, 0.2, 1.25, 1.5],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.0);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);
const uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) } };

function tileX(uvX) { return (uvX - 0.5) * 4; }
function tileZ(uvY) { return (uvY - 0.5) * 4; }

const sproutCenters = [
  new THREE.Vector2(0.28, 0.36),
  new THREE.Vector2(0.58, 0.54),
  new THREE.Vector2(0.72, 0.30),
  new THREE.Vector2(0.42, 0.72),
];

const tile = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 230, 230),
  new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv; varying float vHeight; varying float vBloom; varying float vMoist; varying float vBare;
      uniform float uTime; uniform vec2 uMouse;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
      float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p*=1.96;a*=.48;}return v;}
      float b(vec2 uv,vec2 c,float r){return smoothstep(r,0.0,length((uv-c)*vec2(1.0,1.24)));}
      void main(){
        vUv=uv; vec2 p=uv*2.0-1.0;
        float broad=fbm(p*1.42+vec2(0.0,uTime*.0025));
        float fine=fbm(p*4.4+vec2(4.0,-2.0));
        vBloom=clamp(b(uv,vec2(.28,.36),.20)*.72+b(uv,vec2(.58,.54),.18)*.58+b(uv,vec2(.72,.30),.14)*.36+b(uv,vec2(.42,.72),.12)*.30+smoothstep(.74,.92,fine)*.12,0.0,1.0);
        vMoist=smoothstep(.11,0.0,abs(uv.x-(.48+sin(uv.y*6.283)*.09)))*.42;
        vBare=1.0-smoothstep(.18,.78,vBloom);
        float pulse=exp(-distance(uv,uMouse)*10.0)*.018;
        vHeight=broad*.68+fine*.28;
        vec3 pos=position;
        pos.z=(broad-.5)*.11+(fine-.5)*.032+vBloom*.028-vMoist*.018+pulse;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv; varying float vHeight; varying float vBloom; varying float vMoist; varying float vBare; uniform float uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(41.7,289.1)))*97143.231);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
      void main(){
        vec3 plum=vec3(.129,.086,.129), dry=vec3(.50,.40,.30), dust=vec3(.74,.62,.46), young=vec3(.55,.78,.34), pale=vec3(.78,.94,.56), pink=vec3(1.0,.60,.75), mint=vec3(.48,.92,.78);
        float shade=smoothstep(.12,.84,vHeight);
        float grain=noise(vUv*76.0);
        float fleck=step(.972,hash(floor(vUv*145.0)))*vBloom;
        float edge=smoothstep(0.0,.055,vUv.x)*smoothstep(0.0,.055,vUv.y)*smoothstep(0.0,.055,1.0-vUv.x)*smoothstep(0.0,.055,1.0-vUv.y);
        vec3 color=mix(dry,dust,shade*.55+grain*.16);
        color=mix(color,young,smoothstep(.12,.88,vBloom)*.34);
        color+=pale*smoothstep(.52,1.0,vBloom)*.08;
        color+=mint*vMoist*.12+pink*fleck*.24;
        color+=vec3(grain-.5)*.055;
        color=mix(plum,color,edge);
        gl_FragColor=vec4(color,1.0);
      }`,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.36;
scene.add(tile);

const sproutGroup = new THREE.Group();
scene.add(sproutGroup);

function addSproutCluster(center, count, color) {
  for (let i = 0; i < count; i++) {
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.30 + Math.random() * 0.22, blending: THREE.AdditiveBlending });
    const uv = new THREE.Vector2(center.x + (Math.random() - 0.5) * 0.18, center.y + (Math.random() - 0.5) * 0.14);
    const x = tileX(THREE.MathUtils.clamp(uv.x, 0.04, 0.96));
    const z = tileZ(THREE.MathUtils.clamp(uv.y, 0.04, 0.96));
    const h = 0.045 + Math.random() * 0.12;
    const sprout = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -0.276, z),
        new THREE.Vector3(x + (Math.random() - 0.5) * 0.035, -0.276 + h, z + (Math.random() - 0.5) * 0.035),
      ]),
      material,
    );
    sprout.userData.phase = Math.random() * Math.PI * 2;
    sprout.userData.baseOpacity = material.opacity;
    sproutGroup.add(sprout);
  }
}

sproutCenters.forEach((center, i) => addSproutCluster(center, 7 + i * 2, i % 2 ? 0xffa7c7 : 0xbaf07c));

const sporeCount = 150;
const positions = new Float32Array(sporeCount * 3);
const colors = new Float32Array(sporeCount * 3);
const palette = [new THREE.Color(0xdfff9a), new THREE.Color(0xffa6c6), new THREE.Color(0xb5ffbe), new THREE.Color(0xa7fff0)];
for (let i = 0; i < sporeCount; i++) {
  const center = sproutCenters[Math.floor(Math.random() * sproutCenters.length)];
  const uv = new THREE.Vector2(center.x + (Math.random() - 0.5) * 0.26, center.y + (Math.random() - 0.5) * 0.22);
  const idx = i * 3;
  positions[idx] = tileX(THREE.MathUtils.clamp(uv.x, 0.03, 0.97));
  positions[idx + 1] = -0.16 + Math.pow(Math.random(), 2.3) * 0.48;
  positions[idx + 2] = tileZ(THREE.MathUtils.clamp(uv.y, 0.03, 0.97));
  const color = palette[Math.floor(Math.random() * palette.length)];
  colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b;
}
const sporeGeometry = new THREE.BufferGeometry();
sporeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
sporeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const sporeMaterial = new THREE.PointsMaterial({ size: 0.018, transparent: true, opacity: 0.34, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending });
const spores = new THREE.Points(sporeGeometry, sporeMaterial);
scene.add(spores);

const vignette = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader: `varying vec2 vUv;void main(){float a=smoothstep(.32,.80,distance(vUv,vec2(.5)))*.58;gl_FragColor=vec4(.129,.086,.129,a);}`,
}));
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
  const t = now * 0.001;
  smoothPointer.lerp(pointer, 0.055);
  uniforms.uTime.value = t;
  uniforms.uMouse.value.copy(smoothPointer);
  sproutGroup.children.forEach((sprout, i) => {
    sprout.rotation.z = Math.sin(t * 0.48 + sprout.userData.phase) * 0.012;
    sprout.material.opacity = sprout.userData.baseOpacity * (0.78 + (Math.sin(t * 0.42 + i) * 0.5 + 0.5) * 0.22);
  });
  spores.rotation.y = Math.sin(t * 0.06) * 0.028;
  spores.position.y = Math.sin(t * 0.30) * 0.012;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
