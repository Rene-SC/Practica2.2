//================================================================================
//                                DOCUMENTACION DE CODIGO
//================================================================================
// NOMBRE DEL ARCHIVO / MODULO : practica2.2.js
// PROYECTO                    : Practica 2 - Simulación de Fogata
// AUTOR                       : Omar Alejandro Aguayo Sanchez, Rene Servin Cansino
// FECHA DE ELABORACION        : 05/10/2026
// TIEMPO DE DESARROLLO        : 4 horas
// VERSION                     : 2.0.5
//================================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ============================================================
// 1. ESCENA, CÁMARA Y RENDERER
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x05060a, 0.035);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 5.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.target.set(0, 0.5, 0);

// ============================================================
// VARIABLES DE CALIBRACIÓN DE ALTURA
// ============================================================
const DESPLAZAMIENTO_Y_FOGATA = -0.29;
const DESPLAZAMIENTO_Y_CABALLERO = -0.18; // Baja la piedra para que penetre el suelo

// ============================================================
// 2. PANEL DE INFORMACIÓN ACADÉMICO
// ============================================================
const panelInfo = document.createElement('div');
panelInfo.style.position = 'fixed';
panelInfo.style.bottom = '15px';
panelInfo.style.left = '15px';
panelInfo.style.padding = '10px 15px';
panelInfo.style.background = 'rgba(0, 0, 0, 0.8)';
panelInfo.style.color = '#ffffff';
panelInfo.style.fontFamily = 'monospace, sans-serif';
panelInfo.style.fontSize = '13px';
panelInfo.style.lineHeight = '1.4';
panelInfo.style.border = '1px solid #ff6600';
panelInfo.style.borderRadius = '6px';
panelInfo.style.zIndex = '1000';
panelInfo.style.userSelect = 'none';

panelInfo.innerHTML = `
    <strong>Práctica 2 - Simulación de Fogata</strong><br>
   
`;
document.body.appendChild(panelInfo);

// ============================================================
// 3. ILUMINACIÓN BASE Y DE FUEGO
// ============================================================
const luzLuna = new THREE.DirectionalLight(0x2a3d60, 0.55);
luzLuna.position.set(6, 14, 6);
scene.add(luzLuna);

const luzAmbiente = new THREE.AmbientLight(0x0a0f1a, 0.75);
scene.add(luzAmbiente);

const fuegoLuz = new THREE.PointLight(0xff6600, 18, 16, 1.6);
fuegoLuz.position.set(0, 0.6 + DESPLAZAMIENTO_Y_FOGATA, 0);
fuegoLuz.castShadow = true;
fuegoLuz.shadow.bias = -0.002;
fuegoLuz.shadow.mapSize.width = 2048;
fuegoLuz.shadow.mapSize.height = 2048;
scene.add(fuegoLuz);

const fuegoLuzBrasas = new THREE.PointLight(0xff1a00, 8, 7, 2.0);
fuegoLuzBrasas.position.set(0, 0.2 + DESPLAZAMIENTO_Y_FOGATA, 0);
scene.add(fuegoLuzBrasas);

// ============================================================
// 4. SUELO
// ============================================================
const sueloGeo = new THREE.PlaneGeometry(60, 60);
const sueloMat = new THREE.MeshStandardMaterial({
    color: 0x0f1116,
    roughness: 0.95,
    metalness: 0.05
});
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.position.y = -0.15;
suelo.receiveShadow = true;
scene.add(suelo);

// ============================================================
// 5. CARGA DE MODELOS (bonfire.glb Y caballero.glb)
// ============================================================
const loader = new GLTFLoader();

// --- 5.1 FOGATA ---
const RUTA_FOGATA = new URL('./fogata/bonfire.glb', import.meta.url).href;

loader.load(
    RUTA_FOGATA,
    (gltf) => {
        const fogata = gltf.scene;

        fogata.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(fogata);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        fogata.position.x = -center.x;
        fogata.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0 && Number.isFinite(maxDim)) {
            const factor = 2.8 / maxDim;
            fogata.scale.setScalar(factor);
            fogata.position.y = (-box.min.y * factor) + DESPLAZAMIENTO_Y_FOGATA;
        }

        scene.add(fogata);
    },
    undefined,
    (error) => {
        console.error('Error al cargar bonfire.glb:', error);
    }
);

// --- 5.2 CABALLERO ---
let mixerCaballero = null;
const RUTA_CABALLERO = new URL('./fogata/caballero.glb', import.meta.url).href;

loader.load(
    RUTA_CABALLERO,
    (gltf) => {
        const caballero = gltf.scene;

        caballero.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        if (gltf.animations && gltf.animations.length > 0) {
            mixerCaballero = new THREE.AnimationMixer(caballero);
            const accion = mixerCaballero.clipAction(gltf.animations[0]);
            accion.play();
        }

        // 1. Escala proporcional
        const box = new THREE.Box3().setFromObject(caballero);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        caballero.position.x = -center.x;
        caballero.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        let factor = 1.0;
        if (maxDim > 0 && Number.isFinite(maxDim)) {
            factor = 2.0 / maxDim;
            caballero.scale.setScalar(factor);
        }

        // 2. Altura calculada con penetración en el suelo para la piedra
        const alturaSuelo = (-box.min.y * factor) + DESPLAZAMIENTO_Y_CABALLERO;
        caballero.position.set(1.2, alturaSuelo, 0.35);

        // 3. Rotación HORIZONTAL EXCLUSIVA (evita inclinar la piedra hacia arriba)
        caballero.lookAt(0, alturaSuelo, 0);

        scene.add(caballero);
    },
    undefined,
    (error) => {
        console.error('Error al cargar caballero.glb:', error);
    }
);

// ============================================================
// 6. SISTEMA DE LLAMAS REALISTAS
// ============================================================

function crearTexturaLlama() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 180, 5, 64, 160, 75);
    grad.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 200, 30, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.75)');
    grad.addColorStop(0.8, 'rgba(180, 20, 0, 0.3)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(64, 160, 55, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function crearTexturaGlowBase() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 220, 120, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 100, 0, 0.6)');
    grad.addColorStop(0.7, 'rgba(180, 20, 0, 0.2)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

const grupoFuego = new THREE.Group();
grupoFuego.position.set(0, 0.15 + DESPLAZAMIENTO_Y_FOGATA, 0);
scene.add(grupoFuego);

const glowBaseMat = new THREE.SpriteMaterial({
    map: crearTexturaGlowBase(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
});
const glowBase = new THREE.Sprite(glowBaseMat);
glowBase.scale.set(1.4, 1.4, 1);
glowBase.position.set(0, 0.2, 0);
grupoFuego.add(glowBase);

const CANTIDAD_LLAMAS = 24;
const llamas = [];
const llamaMat = new THREE.SpriteMaterial({
    map: crearTexturaLlama(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});

for (let i = 0; i < CANTIDAD_LLAMAS; i++) {
    const sprite = new THREE.Sprite(llamaMat.clone());
    const angulo = Math.random() * Math.PI * 2;
    const radio = 0.05 + Math.random() * 0.22;
    const alturaInicial = Math.random() * 0.9;

    sprite.position.set(
        Math.cos(angulo) * radio,
        alturaInicial,
        Math.sin(angulo) * radio
    );

    const escalaBase = 0.5 + Math.random() * 0.45;
    sprite.scale.set(escalaBase * 0.7, escalaBase * 1.3, 1);

    grupoFuego.add(sprite);

    llamas.push({
        mesh: sprite,
        radio: radio,
        angulo: angulo,
        velocidadY: 0.8 + Math.random() * 0.9,
        velocidadGiro: (Math.random() - 0.5) * 2.0,
        vida: Math.random(),
        escalaBase: escalaBase
    });
}

// ============================================================
// 7. SISTEMA DE CHISPAS Y BRASAS ASCENDENTES (EMBERS)
// ============================================================
const CANTIDAD_CHISPAS = 140;
const chispasGeo = new THREE.BufferGeometry();
const posiciones = new Float32Array(CANTIDAD_CHISPAS * 3);
const datosChispas = [];

for (let i = 0; i < CANTIDAD_CHISPAS; i++) {
    const r = Math.random() * 0.35;
    const a = Math.random() * Math.PI * 2;
    const y = Math.random() * 2.2;

    posiciones[i * 3] = Math.cos(a) * r;
    posiciones[i * 3 + 1] = y;
    posiciones[i * 3 + 2] = Math.sin(a) * r;

    datosChispas.push({
        angulo: a,
        radio: r,
        vy: 0.4 + Math.random() * 0.8,
        vGiro: (Math.random() - 0.5) * 3.0,
        fase: Math.random() * Math.PI * 2
    });
}

chispasGeo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));

function crearTexturaPuntoChispa() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 180, 50, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 50, 0, 0.3)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

const chispasMat = new THREE.PointsMaterial({
    size: 0.12,
    map: crearTexturaPuntoChispa(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const sistemaChispas = new THREE.Points(chispasGeo, chispasMat);
grupoFuego.add(sistemaChispas);

// ============================================================
// 8. BUCLE PRINCIPAL DE ANIMACIÓN
// ============================================================
let tiempoPrevio = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const tiempoActual = performance.now();
    const delta = Math.min((tiempoActual - tiempoPrevio) * 0.001, 0.05);
    tiempoPrevio = tiempoActual;

    const t = tiempoActual * 0.001;

    if (mixerCaballero) {
        mixerCaballero.update(delta);
    }

    const fluctuacion =
        Math.sin(t * 16.0) * 2.8 +
        Math.sin(t * 29.0) * 1.7 +
        Math.sin(t * 43.0) * 0.9;

    fuegoLuz.intensity = 18 + fluctuacion;
    fuegoLuz.position.x = Math.sin(t * 12.0) * 0.05;
    fuegoLuz.position.z = Math.cos(t * 14.0) * 0.05;

    fuegoLuzBrasas.intensity = 8 + Math.sin(t * 9.0) * 2.0;

    glowBase.scale.setScalar(1.3 + Math.sin(t * 10.0) * 0.15);

    llamas.forEach((item) => {
        item.vida += delta * item.velocidadY;
        if (item.vida > 1.0) {
            item.vida = 0.0;
            item.angulo = Math.random() * Math.PI * 2;
            item.radio = 0.04 + Math.random() * 0.22;
        }

        item.angulo += item.velocidadGiro * delta;
        const altura = item.vida * 1.35;

        item.mesh.position.y = altura;
        const radioActual = item.radio * (1.0 - item.vida * 0.55);
        item.mesh.position.x = Math.cos(item.angulo) * radioActual;
        item.mesh.position.z = Math.sin(item.angulo) * radioActual;

        const factorVida = Math.sin(item.vida * Math.PI);
        item.mesh.scale.set(item.escalaBase * 0.7 * factorVida, item.escalaBase * 1.3 * factorVida, 1);
        item.mesh.material.opacity = factorVida * 0.85;
    });

    const pos = chispasGeo.attributes.position.array;
    for (let i = 0; i < CANTIDAD_CHISPAS; i++) {
        const d = datosChispas[i];
        const idx = i * 3;

        pos[idx + 1] += d.vy * delta;
        d.angulo += d.vGiro * delta;

        pos[idx] = Math.cos(d.angulo) * (d.radio + Math.sin(t * 3 + d.fase) * 0.05);
        pos[idx + 2] = Math.sin(d.angulo) * (d.radio + Math.cos(t * 3 + d.fase) * 0.05);

        if (pos[idx + 1] > 2.4) {
            pos[idx + 1] = 0.15 + Math.random() * 0.1;
            d.radio = Math.random() * 0.35;
        }
    }
    chispasGeo.attributes.position.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();