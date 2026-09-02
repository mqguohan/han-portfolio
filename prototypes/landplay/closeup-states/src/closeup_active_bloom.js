import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Active Bloom';

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
scene.fog = new THREE.FogExp2(BG, 0.158);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(4.2, 3.0, 5.08);

const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.055,
  autoRotate: true,
  autoRotateSpeed: 0.22,
  enablePan: false,
  minDistance: 3.65,
  maxDistance: 8.4,
  maxPolarAngle: Math.PI * 0.49,
});
controls.target.set(0, -0.08, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xeaffd4, 0x211621, 1.48));
const rim = new THREE.DirectionalLight(0xcaff9d, 2.15);
rim.position.set(-3.8, 5.8, 2.7);
scene.add(rim);
[
  [0x9dff76, 5.2, -1.4, 0.95, 1.0],
  [0xff7bac, 4.9, 1.4, 1.05, 0.8],
  [0x7fffe0, 3.6, 0.9, 0.8, -1.5],
  [0xf1ff9a, 3.1, -0.4, 1.4, -0.2],
].forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 7.2);
  light.position.set(x, y, z);
  scene.add(light);
});

const pointer = new THREE.Vector2(0.5, 0.5);
const smoothPointer = new THREE.Vector2(0.5, 0.5);
const uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) } };

function tileX(uvX) { return (uvX - 0.5) * 4; }
function tileZ(uvY) { return (uvY - 0.5) * 4; }
function growthPathX(y) { return 0.46 + Math.sin((y - 0.08) * Math.PI * 2.0) * 0.21 + Math.sin(y * Math.PI * 4.0 + 0.9) * 0.04; }
function sampleGrowth(spread = 0.18) {
  const y = 0.08 + Math.random() * 0.84;
  return new THREE.Vector2(THREE.MathUtils.clamp(growthPathX(y) + (Math.random() - 0.5) * spread, 0.04, 0.96), y);
}

const bloomCenters = [
  new THREE.Vector2(0.25, 0.28),
  new THREE.Vector2(0.42, 0.45),
  new THREE.Vector2(0.60, 0.58),
  new THREE.Vector2(0.73, 0.72),
  new THREE.Vector2(0.78, 0.34),
  new THREE.Vector2(0.24, 0.64),
];

const tile = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 250, 250),
  new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv; varying float vHeight; varying float vBloom; varying float vWet; varying float vSpread; varying float vPulse;
      uniform float uTime; uniform vec2 uMouse;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
      float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p*=1.96;a*=.48;}return v;}
      float b(vec2 uv,vec2 c,float r){return smoothstep(r,0.0,length((uv-c)*vec2(1.0,1.20)));}
      float pathX(float y){return .46+sin((y-.08)*6.2831853)*.21+sin(y*12.56637+.9)*.04;}
      void main(){
        vUv=uv; vec2 p=uv*2.0-1.0;
        float broad=fbm(p*1.48+vec2(0.0,uTime*.004));
        float fine=fbm(p*4.3-vec2(uTime*.012,0.0));
        float colonies=0.0;
        colonies+=b(uv,vec2(.25,.28),.27)*.62;
        colonies+=b(uv,vec2(.42,.45),.30)*.72;
        colonies+=b(uv,vec2(.60,.58),.32)*.82;
        colonies+=b(uv,vec2(.73,.72),.24)*.56;
        colonies+=b(uv,vec2(.78,.34),.22)*.44;
        colonies+=b(uv,vec2(.24,.64),.21)*.38;
        vSpread=smoothstep(.58,.86,fine);
        vBloom=clamp(colonies+vSpread*.24,0.0,1.0);
        vWet=smoothstep(.12,0.0,abs(uv.x-pathX(uv.y)))+smoothstep(.26,0.0,abs(uv.x-pathX(uv.y)))*.25;
        vWet=clamp(vWet,0.0,1.0);
        float md=distance(uv,uMouse);
        vPulse=exp(-md*9.8)*(.62+.38*sin(md*32.0-uTime*3.0));
        vHeight=broad*.58+fine*.36;
        vec3 pos=position;
        pos.z=(broad-.5)*.13+(fine-.5)*.045+vBloom*.055-vWet*.030+vPulse*.038;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv; varying float vHeight; varying float vBloom; varying float vWet; varying float vSpread; varying float vPulse; uniform float uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(41.7,289.1)))*97143.231);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
      float pathX(float y){return .46+sin((y-.08)*6.2831853)*.21+sin(y*12.56637+.9)*.04;}
      void main(){
        vec3 plum=vec3(.129,.086,.129), soil=vec3(.18,.24,.12), earth=vec3(.43,.37,.24), green=vec3(.32,.78,.27), bright=vec3(.62,.95,.34), pink=vec3(1.0,.43,.67), mint=vec3(.28,.96,.82), peach=vec3(1.0,.68,.42);
        float shade=smoothstep(.12,.84,vHeight);
        float grain=noise(vUv*70.0);
        float path=abs(vUv.x-pathX(vUv.y));
        float wetLine=smoothstep(.10,0.0,path);
        float spore=step(.956,hash(floor(vUv*158.0)))*smoothstep(.30,1.0,vBloom);
        float edge=smoothstep(0.0,.055,vUv.x)*smoothstep(0.0,.055,vUv.y)*smoothstep(0.0,.055,1.0-vUv.x)*smoothstep(0.0,.055,1.0-vUv.y);
        vec3 color=mix(soil,earth,shade*.44+grain*.18);
        color=mix(color,green,smoothstep(.14,.90,vBloom)*.52);
        color+=bright*smoothstep(.45,1.0,vBloom)*.16;
        color+=pink*smoothstep(.42,1.0,vBloom)*(.12+.08*sin(uTime*.65+vUv.x*5.0+vUv.y*4.0));
        color+=mint*wetLine*.25+mint*vWet*.07;
        color+=peach*spore*.24+pink*vPulse*smoothstep(.34,1.0,vBloom)*.10;
        color+=vec3(grain-.5)*.065;
        color=mix(plum,color,edge);
        gl_FragColor=vec4(color,1.0);
      }`,
  }),
);
tile.rotation.x = -Math.PI / 2;
tile.position.y = -0.38;
scene.add(tile);

const waterPoints = [];
for (let i = 0; i < 74; i++) {
  const t = i / 73;
  waterPoints.push(new THREE.Vector3(tileX(growthPathX(t)), -0.292, tileZ(t)));
}
const waterRibbon = new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(waterPoints), 160, 0.018, 8, false),
  new THREE.MeshBasicMaterial({ color: 0x78fff0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
);
scene.add(waterRibbon);

const diskGroup = new THREE.Group();
scene.add(diskGroup);
bloomCenters.forEach((center, i) => {
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(0.24 + Math.random() * 0.22, 64),
    new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xb8ff76 : i % 3 === 1 ? 0xff8fba : 0x8dfff0,
      transparent: true,
      opacity: 0.09 + Math.random() * 0.06,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  disk.position.set(tileX(center.x), -0.284 + i * 0.004, tileZ(center.y));
  disk.rotation.x = -Math.PI / 2;
  disk.rotation.z = Math.random() * Math.PI;
  disk.scale.y = 0.42 + Math.random() * 0.26;
  disk.userData.phase = i * 0.68;
  disk.userData.baseOpacity = disk.material.opacity;
  diskGroup.add(disk);
});

const plantGroup = new THREE.Group();
scene.add(plantGroup);
function addBlade(uv, color) {
  const x = tileX(uv.x);
  const z = tileZ(uv.y);
  const h = 0.08 + Math.random() * 0.20;
  const blade = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -0.288, z),
      new THREE.Vector3(x + (Math.random() - 0.5) * 0.07, -0.288 + h, z + (Math.random() - 0.5) * 0.07),
    ]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 + Math.random() * 0.34, blending: THREE.AdditiveBlending }),
  );
  blade.userData.phase = Math.random() * Math.PI * 2;
  blade.userData.baseOpacity = blade.material.opacity;
  plantGroup.add(blade);
}
for (let i = 0; i < 120; i++) addBlade(sampleGrowth(0.38), i % 5 === 0 ? 0xffa3c4 : 0xaaff82);

const sporeCount = 620;
const positions = new Float32Array(sporeCount * 3);
const colors = new Float32Array(sporeCount * 3);
const palette = [new THREE.Color(0xdcff8e), new THREE.Color(0xff94bc), new THREE.Color(0x82fff0), new THREE.Color(0xffc28b)];
for (let i = 0; i < sporeCount; i++) {
  const uv = sampleGrowth(0.46);
  const idx = i * 3;
  positions[idx] = tileX(THREE.MathUtils.clamp(uv.x + (Math.random() - 0.5) * 0.16, 0.03, 0.97));
  positions[idx + 1] = -0.10 + Math.pow(Math.random(), 1.9) * 0.86;
  positions[idx + 2] = tileZ(THREE.MathUtils.clamp(uv.y + (Math.random() - 0.5) * 0.14, 0.03, 0.97));
  const color = palette[Math.floor(Math.random() * palette.length)];
  colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b;
}
const sporeGeometry = new THREE.BufferGeometry();
sporeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
sporeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const sporeMaterial = new THREE.PointsMaterial({ size: 0.020, transparent: true, opacity: 0.40, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending });
const spores = new THREE.Points(sporeGeometry, sporeMaterial);
scene.add(spores);

const vignette = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader: `varying vec2 vUv;void main(){float a=smoothstep(.32,.80,distance(vUv,vec2(.5)))*.60;gl_FragColor=vec4(.129,.086,.129,a);}`,
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
  waterRibbon.material.opacity = 0.17 + (Math.sin(t * 0.75) * 0.5 + 0.5) * 0.12;
  diskGroup.children.forEach((disk, i) => {
    const pulse = Math.sin(t * 0.58 + disk.userData.phase) * 0.5 + 0.5;
    disk.material.opacity = disk.userData.baseOpacity + pulse * 0.04;
    disk.scale.x = 1.0 + pulse * 0.04;
  });
  plantGroup.children.forEach((plant, i) => {
    plant.rotation.z = Math.sin(t * 0.62 + plant.userData.phase) * 0.016;
    plant.material.opacity = plant.userData.baseOpacity * (0.75 + (Math.sin(t * 0.50 + i) * 0.5 + 0.5) * 0.30);
  });
  spores.rotation.y = Math.sin(t * 0.07) * 0.045;
  spores.position.y = Math.sin(t * 0.34) * 0.025;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
