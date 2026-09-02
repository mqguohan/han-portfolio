import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.title = 'Landplay - Recovery Patch';
const BG = 0x211621;
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(BG, 1); renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.style.margin = '0'; document.body.style.overflow = 'hidden'; document.body.style.background = '#211621';
const scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, 0.16);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, .1, 80); camera.position.set(4.2,3.05,5.15);
const controls = new OrbitControls(camera, renderer.domElement); Object.assign(controls,{enableDamping:true,dampingFactor:.055,autoRotate:true,autoRotateSpeed:.17,enablePan:false,minDistance:3.7,maxDistance:8.4,maxPolarAngle:Math.PI*.49}); controls.target.set(0,-.07,0); controls.update();
scene.add(new THREE.HemisphereLight(0xe7ffe3, 0x211621, 1.45)); const rim = new THREE.DirectionalLight(0xb7dcae, 2.0); rim.position.set(-3.8,5.8,2.8); scene.add(rim);
const pointer = new THREE.Vector2(.5,.5), smoothPointer = new THREE.Vector2(.5,.5);
const uniforms = { uTime:{value:0}, uMouse:{value:new THREE.Vector2(.5,.5)} };
const tile = new THREE.Mesh(new THREE.PlaneGeometry(4,4,220,220), new THREE.ShaderMaterial({ uniforms, side:THREE.DoubleSide,
vertexShader:`
varying vec2 vUv; varying float vHeight; varying float vRecover; varying float vScar; varying float vMoist; uniform float uTime; uniform vec2 uMouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);} float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);} float fbm(vec2 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p*=1.96;a*=.48;}return v;} float b(vec2 uv,vec2 c,float r){return smoothstep(r,0.,length((uv-c)*vec2(1.,1.25)));}
void main(){vUv=uv;vec2 p=uv*2.-1.;float broad=fbm(p*1.5+vec2(0,uTime*.003));float fine=fbm(p*4.0+vec2(5,-2));vRecover=clamp(b(uv,vec2(.30,.38),.29)+b(uv,vec2(.60,.58),.34)*.78+b(uv,vec2(.74,.30),.18)*.42,0.,1.);vScar=smoothstep(.70,.88,fbm(p*3.2-6.0))*(1.-vRecover*.65);vMoist=smoothstep(.80,.0,abs(uv.x-(.46+sin(uv.y*7.0)*.08)))*.65;float pulse=exp(-distance(uv,uMouse)*9.5)*.022;vHeight=broad*.64+fine*.25;vec3 pos=position;pos.z=(broad-.5)*.105+(fine-.5)*.025+vRecover*.035-vScar*.035+vMoist*.015+pulse;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}`,
fragmentShader:`
varying vec2 vUv; varying float vHeight; varying float vRecover; varying float vScar; varying float vMoist; uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(41.7,289.1)))*97143.231);}
void main(){vec3 plum=vec3(.129,.086,.129), soil=vec3(.38,.31,.25), dry=vec3(.62,.50,.36), moss=vec3(.36,.62,.29), soft=vec3(.72,.86,.61), scar=vec3(.30,.18,.20), mint=vec3(.55,.78,.70), flower=vec3(.95,.72,.82);float shade=smoothstep(.12,.84,vHeight);float fleck=step(.975,hash(floor(vUv*135.0)))*vRecover;float edge=smoothstep(0.,.055,vUv.x)*smoothstep(0.,.055,vUv.y)*smoothstep(0.,.055,1.-vUv.x)*smoothstep(0.,.055,1.-vUv.y);vec3 color=mix(soil,dry,shade*.42+.18);color=mix(color,scar,vScar*.34);color=mix(color,moss,vRecover*.46);color=mix(color,soft,smoothstep(.35,.95,vRecover)*.20);color+=mint*vMoist*.13+flower*fleck*.22;color=mix(plum,color,edge);gl_FragColor=vec4(color,1.);}` }));
tile.rotation.x=-Math.PI/2; tile.position.y=-.36; scene.add(tile);
const sprouts = new THREE.Group(); scene.add(sprouts);
const sproutMat = new THREE.MeshBasicMaterial({ color:0xb7dcae, transparent:true, opacity:.32, depthWrite:false });
for(let i=0;i<46;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.012,.10+Math.random()*.12),sproutMat);m.position.set((Math.random()-.5)*3.3,-.22+Math.random()*.12,(Math.random()-.5)*3.2);m.rotation.x=-Math.PI/2;m.rotation.z=(Math.random()-.5)*1.2;sprouts.add(m);}
const vignette=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 vUv;void main(){float a=smoothstep(.32,.78,distance(vUv,vec2(.5)))*.60;gl_FragColor=vec4(.129,.086,.129,a);}`}));vignette.renderOrder=10;scene.add(vignette);
window.addEventListener('pointermove',e=>{pointer.x=e.clientX/window.innerWidth;pointer.y=1-e.clientY/window.innerHeight;}); window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));});
function animate(now=0){const t=now*.001;smoothPointer.lerp(pointer,.06);uniforms.uTime.value=t;uniforms.uMouse.value.copy(smoothPointer);sprouts.children.forEach((c,i)=>c.material.opacity=.24+Math.sin(t*.5+i)*.04);controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);} animate();
