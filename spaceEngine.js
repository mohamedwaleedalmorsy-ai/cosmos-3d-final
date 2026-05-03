import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. المتغيرات العامة
export const clickablePlanets = [];
export let scene, camera, renderer, controls, animationId;
export let planets = [];
export let isPaused = false;
export let targetPlanet = null;
export let raycaster = new THREE.Raycaster();
export let mouse = new THREE.Vector2();

// --- الدوال المساعدة لبناء الأجسام ---

function createSun() {
    const sunGeo = new THREE.SphereGeometry(35, 64, 64);
    const tex = new THREE.TextureLoader().load('assets/8k_sun.jpg');
    const sunMat = new THREE.MeshBasicMaterial({ map: tex }); 
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.userData = { name: "الشمس" };
    scene.add(sun);
    clickablePlanets.push(sun);
}

function createEarth(dist, speed) {
    const earthGroup = new THREE.Group();
    const loader = new THREE.TextureLoader();

    // مادة الأرض مع تأثير أضواء الليل
    const earthMat = new THREE.MeshPhongMaterial({
        map: loader.load('assets/8k_earth_daymap.jpg'),
        specularMap: loader.load('assets/8k_earth_specular_map.jpg'),
        emissive: new THREE.Color(0xffff88),
        emissiveMap: loader.load('assets/8k_earth_nightmap.jpg'),
        emissiveIntensity: 0.7, 
        shininess: 5
    });

    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 64), earthMat);
    earthMesh.userData = { name: "الأرض" };
    earthGroup.add(earthMesh);

    // طبقة السحب
    const cloudMat = new THREE.MeshPhongMaterial({
        map: loader.load('assets/8k_earth_clouds.jpg'),
        transparent: true,
        opacity: 0.4,
        depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(10.2, 64, 64), cloudMat);
    earthGroup.add(cloudMesh);

    // القمر
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 32, 32),
        new THREE.MeshPhongMaterial({ map: loader.load('assets/8k_moon.jpg') })
    );
    moon.position.set(25, 0, 0);
    earthGroup.add(moon);

    createOrbitLine(dist);
    earthGroup.userData = { dist, speed, angle: Math.random() * Math.PI * 2, name: "الأرض", moon, clouds: cloudMesh };
    
    scene.add(earthGroup);
    planets.push(earthGroup);
    clickablePlanets.push(earthMesh);
}

function createSaturnWithRings(dist, speed) {
    const saturnGroup = new THREE.Group();
    const loader = new THREE.TextureLoader();
    
    const saturnMesh = new THREE.Mesh(
        new THREE.SphereGeometry(16, 64, 64),
        new THREE.MeshPhongMaterial({ map: loader.load('assets/8k_saturn.jpg') })
    );
    saturnMesh.userData = { name: "زحل" };
    saturnGroup.add(saturnMesh);

    const ringMat = new THREE.MeshPhongMaterial({
        map: loader.load('assets/8k_saturn_ring_alpha.png'),
        transparent: true,
        side: THREE.DoubleSide
    });
    const rings = new THREE.Mesh(new THREE.RingGeometry(22, 40, 64), ringMat);
    rings.rotation.x = Math.PI / 2;
    saturnGroup.add(rings);

    createOrbitLine(dist);
    saturnGroup.userData = { dist, speed, angle: Math.random() * Math.PI * 2, name: "زحل" };
    scene.add(saturnGroup);
    planets.push(saturnGroup);
    clickablePlanets.push(saturnMesh);
}

function addOrbitingPlanet(size, texFile, dist, name, speed) {
    const tex = new THREE.TextureLoader().load(`assets/${texFile}`);
    const planetMat = new THREE.MeshPhongMaterial({ map: tex, shininess: 10 });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), planetMat);
    
    createOrbitLine(dist);
    planet.userData = { dist, speed, angle: Math.random() * Math.PI * 2, name };
    scene.add(planet);
    planets.push(planet);
    clickablePlanets.push(planet);
}

// --- المحرك الرئيسي ---

export async function initSpace(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 200, 500);

    const listener = new THREE.AudioListener();
    camera.add(listener);
    window.planetSound = new THREE.Audio(listener);
    window.audioLoader = new THREE.AudioLoader();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // إضاءة المركز (الشمس)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); 
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 15, 4000);
    sunLight.position.set(0, 0, 0); 
    scene.add(sunLight);

    createStarsField();
    createSun();
    
    // بناء المجموعة الشمسية
    addOrbitingPlanet(4, '8k_mercury.jpg', 70, "عطارد", 0.008);
    addOrbitingPlanet(7, '8k_venus_surface.jpg', 110, "الزهرة", 0.005);
    createEarth(170, 0.002);
    addOrbitingPlanet(6, '8k_mars.jpg', 230, "المريخ", 0.0015);
    createAsteroidBelt();
    addOrbitingPlanet(18, '8k_jupiter.jpg', 340, "المشتري", 0.0008);
    createSaturnWithRings(450, 0.0005);
    addOrbitingPlanet(12, '2k_uranus.jpg', 550, "أورانوس", 0.0004);
    addOrbitingPlanet(12, '2k_neptune.jpg', 650, "نبتون", 0.0002);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onPlanetClick);

    animate();
}

window.playPlanetAudio = function(name) {
    if (window.planetSound && window.planetSound.isPlaying) window.planetSound.stop();

    const soundFiles = {
        "الشمس": "assets/sun.mp3", "الأرض": "assets/الارض.mp3", "المريخ": "assets/المريخ.mp3",
        "عطارد": "assets/عطارد.mp3", "الزهرة": "assets/الزهره.mp3", "المشتري": "assets/المشتري .mp3",
        "زحل": "assets/زحل 1.mp3", "أورانوس": "assets/اورانوس.mp3", "نبتون": "assets/نيبتون.mp3"
    };

    const fileName = soundFiles[name];
    if (fileName && window.audioLoader) {
        window.audioLoader.load(fileName, (buffer) => {
            window.planetSound.setBuffer(buffer);
            window.planetSound.play();
        });
    }
};

function animate() {
    animationId = requestAnimationFrame(animate);
    if (!isPaused) {
        planets.forEach(p => {
            p.userData.angle += p.userData.speed;
            p.position.x = Math.cos(p.userData.angle) * p.userData.dist;
            p.position.z = Math.sin(p.userData.angle) * p.userData.dist;
            p.rotation.y += 0.01;
            if (p.userData.moon) {
                const t = Date.now() * 0.002;
                p.userData.moon.position.set(Math.cos(t) * 15, 0, Math.sin(t) * 15);
            }
            if (p.userData.clouds) p.userData.clouds.rotation.y += 0.001;
        });
    }
    if (targetPlanet) {
        const targetPos = new THREE.Vector3();
        targetPlanet.getWorldPosition(targetPos);
        camera.position.lerp(targetPos.clone().add(new THREE.Vector3(0, 30, 60)), 0.05);
        controls.target.lerp(targetPos, 0.05);
    }
    controls.update();
    renderer.render(scene, camera);
}

function onPlanetClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickablePlanets, true);
    if (intersects.length > 0) {
        let selected = intersects[0].object;
        while (selected.parent && !(selected.userData && selected.userData.name)) {
            selected = selected.parent;
        }
        if (selected.userData.name) {
            isPaused = true;
            targetPlanet = selected;
            if (window.openPlanetModal) window.openPlanetModal(selected.userData.name);
        }
    }
}

function createOrbitLine(radius) {
    const orbit = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getPoints(128)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
    );
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
}

function createStarsField() {
    const vertices = [];
    for (let i = 0; i < 5000; i++) vertices.push((Math.random()-0.5)*4000, (Math.random()-0.5)*4000, (Math.random()-0.5)*4000);
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 })));
}

function createAsteroidBelt() {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (let i = 0; i < 1000; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        const a = Math.random() * Math.PI * 2;
        const d = 280 + Math.random() * 40;
        mesh.position.set(Math.cos(a) * d, (Math.random() - 0.5) * 10, Math.sin(a) * d);
        scene.add(mesh);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function resetSpaceView() {
    if (window.planetSound && window.planetSound.isPlaying) window.planetSound.stop();
    isPaused = false;
    targetPlanet = null;
    if (document.getElementById('planet-info')) document.getElementById('planet-info').style.display = 'none';
    gsap.to(camera.position, { x: 0, y: 200, z: 500, duration: 2, ease: "power2.inOut" });
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 2, ease: "power2.inOut", onUpdate: () => controls.update() });
}