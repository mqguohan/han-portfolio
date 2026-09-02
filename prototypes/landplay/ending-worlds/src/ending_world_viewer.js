import { ENDING_WORLD_REGISTRY } from './ending_world_registry.js';

const params = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
const endingKey = params.get('ending') || hashParams.get('ending') || 'bloom_landscape';
const presentationMode = params.get('presentation') === '1';
let presentationReturnStarted = false;
if (params.get('capture') === '1') {
  document.body.classList.add('capture-mode');
}

const els = {
  title: document.getElementById('worldTitle'),
  subtitle: document.getElementById('worldSubtitle'),
  description: document.getElementById('worldDescription'),
  kicker: document.getElementById('worldKicker'),
  metrics: document.getElementById('metricGrid'),
  statusPanel: document.getElementById('worldStatusPanel'),
  assetStatus: document.getElementById('assetStatus'),
  reload: document.getElementById('reloadWorld'),
  returnToReport: document.getElementById('returnToReport'),
  toggleInterface: document.getElementById('toggleInterface'),
  mount: document.getElementById('worldMount')
};

let rendererState = null;
let sparkRuntime = null;
let interfaceHidden = false;
const WALK_SPEED = 1.25;
const MOVEMENT_BOUNDARY_RADIUS = 18;
const movementKeys = {
  w: false,
  a: false,
  s: false,
  d: false
};

els.reload?.addEventListener('click', () => window.location.reload());
els.returnToReport?.addEventListener('click', returnToReport);
els.toggleInterface?.addEventListener('click', () => setInterfaceHidden(!interfaceHidden));
window.addEventListener('keydown', handleViewerKeydown);
window.addEventListener('keyup', handleViewerKeyup);

setStatus('Ending-world module started. Loading metadata.');

function setStatus(html) {
  if (!els.assetStatus) return;
  els.assetStatus.innerHTML = html;
  els.assetStatus.classList.toggle('is-error', /<strong>|could not|not found|unsupported|not registered/i.test(html));
}

function setInterfaceHidden(hidden) {
  interfaceHidden = hidden;
  document.body.classList.toggle('interface-hidden', interfaceHidden);
  if (els.toggleInterface) {
    els.toggleInterface.textContent = interfaceHidden ? 'Show Interface' : 'Hide Interface';
    els.toggleInterface.setAttribute('aria-pressed', String(interfaceHidden));
  }
}

function handleViewerKeydown(event) {
  const key = event.key?.toLowerCase();
  const target = event.target;
  const isTyping = target?.matches?.('input, textarea, select') || target?.closest?.('[contenteditable]');
  if (isTyping) return;

  if (presentationMode && key === 'p') {
    if (event.repeat || presentationReturnStarted) return;
    event.preventDefault();
    presentationReturnStarted = true;
    let returnUrl = '../index.html';
    try {
      returnUrl = sessionStorage.getItem('landplay:presentationReturnUrl') || returnUrl;
    } catch (_) {
      // The same-origin fallback remains available if storage is restricted.
    }
    window.location.assign(returnUrl);
    return;
  }

  if (key in movementKeys) {
    event.preventDefault();
    movementKeys[key] = true;
    return;
  }

  if (key === '0') {
    event.preventDefault();
    resetCameraHome();
    return;
  }

  if (key === 'h') {
    event.preventDefault();
    setInterfaceHidden(!interfaceHidden);
  }

  if (event.key === 'Escape' && interfaceHidden) {
    event.preventDefault();
    setInterfaceHidden(false);
  }
}

function handleViewerKeyup(event) {
  const key = event.key?.toLowerCase();
  if (key in movementKeys) {
    event.preventDefault();
    movementKeys[key] = false;
  }
}

function clearMovementKeys() {
  Object.keys(movementKeys).forEach(key => {
    movementKeys[key] = false;
  });
}

function resetCameraHome() {
  if (!rendererState?.homeCameraPosition || !rendererState?.homeTarget) return;
  rendererState.camera.position.copy(rendererState.homeCameraPosition);
  rendererState.controls.target.copy(rendererState.homeTarget);
  clearMovementKeys();
  rendererState.controls.update();
}

function applyKeyboardMovement(state, deltaSeconds) {
  if (!state?.camera || !state?.controls) return;
  const forwardInput = (movementKeys.w ? 1 : 0) - (movementKeys.s ? 1 : 0);
  const strafeInput = (movementKeys.d ? 1 : 0) - (movementKeys.a ? 1 : 0);
  if (!forwardInput && !strafeInput) return;

  const { THREE, moveForward, moveRight, moveDelta, boundaryOffset } = state;
  state.camera.getWorldDirection(moveForward);
  moveForward.y = 0;

  if (moveForward.lengthSq() < 0.0001) {
    moveForward.subVectors(state.controls.target, state.camera.position);
    moveForward.y = 0;
  }

  if (moveForward.lengthSq() < 0.0001) {
    moveForward.set(0, 0, -1);
  } else {
    moveForward.normalize();
  }

  moveRight.crossVectors(moveForward, THREE.Object3D.DEFAULT_UP).normalize();
  moveDelta.set(0, 0, 0)
    .addScaledVector(moveForward, forwardInput)
    .addScaledVector(moveRight, strafeInput);

  if (moveDelta.lengthSq() < 0.0001) return;
  moveDelta.normalize().multiplyScalar(WALK_SPEED * deltaSeconds);

  if (state.homeTarget) {
    boundaryOffset.copy(state.controls.target).add(moveDelta).sub(state.homeTarget);
    boundaryOffset.y = 0;
    if (boundaryOffset.length() > MOVEMENT_BOUNDARY_RADIUS) {
      return;
    }
  }

  state.camera.position.add(moveDelta);
  state.controls.target.add(moveDelta);
}

function returnToReport() {
  const fallback = '../index.html';
  const currentPath = window.location.pathname;
  let usedHistory = false;

  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const sameOrigin = referrer && referrer.origin === window.location.origin;
    const notViewer = referrer && !referrer.pathname.endsWith('/ending_world_viewer.html');
    if (sameOrigin && notViewer && window.history.length > 1) {
      window.history.back();
      usedHistory = true;
    }
  } catch (error) {
    console.warn('[ending-world] return referrer check failed', error);
  }

  if (usedHistory) {
    window.setTimeout(() => {
      if (window.location.pathname === currentPath) {
        window.location.href = fallback;
      }
    }, 500);
    return;
  }

  window.location.href = fallback;
}

function metricLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
}

function renderMetadata(metadata) {
  document.title = `Landplay - ${metadata.title}`;
  if (els.kicker) els.kicker.textContent = metadata.subtitle || 'Ending World';
  if (els.title) els.title.textContent = metadata.title || endingKey;
  if (els.subtitle) els.subtitle.textContent = metadata.dominantTendency ? `Dominant tendency: ${metadata.dominantTendency}` : '';
  if (els.description) els.description.textContent = metadata.description || '';

  if (els.metrics) {
    els.metrics.innerHTML = Object.entries(metadata.relatedMetrics || {})
      .map(([key, value]) => `<div class="metric"><span>${metricLabel(key)}</span><strong>${value}</strong></div>`)
      .join('');
  }

  if (els.statusPanel) {
    const ui = metadata.uiText || {};
    els.statusPanel.innerHTML = `
      <div><strong>System reading:</strong> ${ui.systemReading || 'No reading available.'}</div>
      <div><strong>Dominant force:</strong> ${ui.dominantForce || metadata.dominantTendency || 'unknown'}</div>
      <div><strong>Risk:</strong> ${ui.risk || 'No risk text available.'}</div>
    `;
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

async function assetExists(path) {
  try {
    const response = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
    if (response.ok) return true;

    const fallbackResponse = await fetch(path, {
      headers: { Range: 'bytes=0-32' },
      cache: 'no-cache'
    });
    return fallbackResponse.ok || fallbackResponse.status === 206;
  } catch (error) {
    console.warn('[ending-world] asset check failed', error);
    return false;
  }
}

function disposeRenderer() {
  if (!rendererState) return;
  window.removeEventListener('resize', rendererState.onResize);
  cancelAnimationFrame(rendererState.animationFrame);
  rendererState.controls?.dispose();
  rendererState.renderer?.dispose();
  rendererState.canvas?.remove();
  clearMovementKeys();
  rendererState = null;
}

async function importSparkRuntime() {
  if (sparkRuntime) return sparkRuntime;

  try {
    const [threeModule, controlsModule, sparkModule] = await Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
      import('@sparkjsdev/spark')
    ]);

    const SparkRendererClass = sparkModule.SparkRenderer || sparkModule.NewSparkRenderer;
    if (!SparkRendererClass || !sparkModule.SplatMesh) {
      throw new Error(`Spark module loaded but did not export the expected renderer and SplatMesh. Exports: ${Object.keys(sparkModule).join(', ')}`);
    }

    sparkRuntime = {
      THREE: threeModule,
      OrbitControls: controlsModule.OrbitControls,
      SparkRenderer: SparkRendererClass,
      SplatMesh: sparkModule.SplatMesh
    };
    return sparkRuntime;
  } catch (error) {
    throw new Error(`Spark import failed: ${error.message}`);
  }
}

function withTimeout(promise, milliseconds, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), milliseconds);
    })
  ]);
}

async function setupSparkWorld(metadata, splatPath) {
  if (!els.mount) throw new Error('World mount element was not found.');
  disposeRenderer();

  const { THREE, OrbitControls, SparkRenderer, SplatMesh } = await withTimeout(
    importSparkRuntime(),
    8000,
    'Spark / Three runtime could not be loaded. Check the external CDN scripts or use a network that allows them.'
  );
  const cameraSettings = metadata.camera || {};
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(metadata.theme?.background || '#211621'), 1);
  els.mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(metadata.theme?.background || '#211621');

  const camera = new THREE.PerspectiveCamera(
    cameraSettings.fov || 55,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  );
  camera.position.fromArray(cameraSettings.position || [0.8, 1.2, 3.6]);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = cameraSettings.minDistance ?? 0.3;
  controls.maxDistance = cameraSettings.maxDistance ?? 12.0;
  controls.target.fromArray(cameraSettings.target || [0, 0.4, 0]);
  controls.update();
  const homeCameraPosition = camera.position.clone();
  const homeTarget = controls.target.clone();

  const sparkRenderer = new SparkRenderer({ renderer });
  scene.add(sparkRenderer);

  const splat = new SplatMesh({
    url: splatPath,
    onLoad: () => {
      setStatus(`Spark.js world loaded.<br>Asset: ${splatPath}<br>Format: .spz`);
    },
    onProgress: progress => {
      const percent = Number.isFinite(progress) ? ` ${Math.round(progress * 100)}%` : '';
      setStatus(`Loading SPZ asset${percent}.<br>Asset: ${splatPath}<br>Format: .spz`);
    }
  });
  scene.add(splat);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const state = {
    renderer,
    scene,
    camera,
    controls,
    sparkRenderer,
    splat,
    canvas: renderer.domElement,
    onResize,
    animationFrame: 0,
    clock: new THREE.Clock(),
    homeCameraPosition,
    homeTarget,
    THREE,
    moveForward: new THREE.Vector3(),
    moveRight: new THREE.Vector3(),
    moveDelta: new THREE.Vector3(),
    boundaryOffset: new THREE.Vector3()
  };

  const animate = () => {
    state.animationFrame = requestAnimationFrame(animate);
    applyKeyboardMovement(state, Math.min(state.clock.getDelta(), 0.05));
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  rendererState = state;
  console.info('Spark ending-world renderer initialized', { endingKey, splatPath });
}

function showFallbackWorld(metadata, message) {
  if (!els.mount) return;

  els.mount.insertAdjacentHTML('beforeend', `
    <div style="
      position:absolute;
      right:7vw;
      top:14vh;
      width:min(36vw,420px);
      min-width:280px;
      padding:18px;
      border:1px solid rgba(255,216,235,.26);
      color:rgba(255,248,242,.78);
      background:rgba(33,22,33,.48);
      backdrop-filter:blur(12px);
      z-index:2;
      font-size:12px;
      line-height:1.6;">
      <div style="color:${metadata.theme?.accent || '#7fffe0'};letter-spacing:.14em;text-transform:uppercase;font-size:10px;margin-bottom:8px;">World Lab Fallback</div>
      <div>${message}</div>
    </div>
  `);
}

async function loadEndingWorld() {
  const metadataPath = ENDING_WORLD_REGISTRY[endingKey];
  if (!metadataPath) {
    setStatus(`<strong>Ending world is not registered.</strong><br>Requested ending: ${endingKey}`);
    if (els.title) els.title.textContent = 'Ending World Not Registered';
    return;
  }

  try {
    const metadata = await fetchJson(metadataPath);
    renderMetadata(metadata);

    const splatPath = metadata.assets?.splat;
    const format = String(metadata.assets?.format || '').toLowerCase();
    if (!splatPath) {
      setStatus('<strong>No World Lab asset path was found in metadata.</strong>');
      showFallbackWorld(metadata, 'The ending metadata loaded, but no .spz asset path was provided.');
      return;
    }

    if (format !== 'spz') {
      setStatus(`<strong>Unsupported ending-world format.</strong><br>Asset: ${splatPath}<br>Format: .${format || 'unknown'}`);
      showFallbackWorld(metadata, `The viewer is currently configured for Spark.js .spz worlds. This ending points to .${format || 'unknown'}.`);
      return;
    }

    const found = await assetExists(splatPath);
    if (!found) {
      setStatus(`<strong>Ending world asset could not be found.</strong><br>Expected asset: ${splatPath}<br>Format: .spz`);
      showFallbackWorld(metadata, `Spark.js is ready to load the world, but the .spz file was not found at ${splatPath}.`);
      return;
    }

    setStatus(`Loading Spark.js world.<br>Asset: ${splatPath}<br>Format: .spz`);
    await setupSparkWorld(metadata, splatPath);
  } catch (error) {
    console.error('[ending-world] failed to load ending world', error);
    setStatus(`<strong>Ending world could not be loaded.</strong><br>${error.message}`);
    showFallbackWorld({ theme: { accent: '#7fffe0' } }, error.message);
  }
}

loadEndingWorld();
