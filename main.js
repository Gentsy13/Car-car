import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

let buildings = [];
let car;
let carSpeed = 0;
const maxSpeed = 0.1;
const acceleration = 0.02;
const turnSpeed = 0.05;

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 6, 20);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  scene.add(ambientLight, dirLight);

  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  const buildingNames = [
    "building-a",
    "building-b",
    "building-c",
    "building-f",
  ];

  // --- Ground (keep grass) ---
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x339933,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // --- Randomized maze buildings ---
  function createMazeBuildings() {
    for (let i = 0; i < 15; i++) {
      const clumpSize = Math.floor(Math.random() * 3) + 1; // 1–3 buildings per clump
      const xCenter = Math.floor(Math.random() * 40 - 20);
      const zCenter = Math.floor(Math.random() * 40 - 20);

      for (let j = 0; j < clumpSize; j++) {
        let x = xCenter + (Math.random() - 0.5) * 4;
        let z = zCenter + (Math.random() - 0.5) * 4;

        const name =
          buildingNames[Math.floor(Math.random() * buildingNames.length)];

        mtlLoader.load(`assets/${name}.mtl`, (mtl) => {
          mtl.preload();
          objLoader.setMaterials(mtl);
          objLoader.load(`assets/${name}.obj`, (root) => {
            root.position.set(x, 0, z);

            // Default 3x bigger
            const scale = (0.5 + Math.random() * 0.5) * 3;
            root.scale.set(scale, scale, scale);

            scene.add(root);
            buildings.push(root);
          });
        });
      }
    }
  }

  createMazeBuildings();

  // --- Load ambulance ---
  mtlLoader.load("assets/ambulance.mtl", (mtl) => {
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load("assets/ambulance.obj", (root) => {
      root.position.set(0, 0, 5);
      root.scale.set(0.4, 0.4, 0.4);
      root.rotation.y = Math.PI;
      car = root;
      scene.add(root);
    });
  });

  // --- Scaling buttons ---
  const scaleFactor = 1.1;
  document.getElementById("btnScaleUp").addEventListener("click", () => {
    buildings.forEach((b) => b.scale.multiplyScalar(scaleFactor));
  });
  document.getElementById("btnScaleDown").addEventListener("click", () => {
    buildings.forEach((b) => b.scale.multiplyScalar(1 / scaleFactor));
  });

  // --- Car keyboard controls ---
  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.code] = true));
  window.addEventListener("keyup", (e) => (keys[e.code] = false));

  // --- Animate loop ---
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (car) {
      if (keys["KeyW"]) carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
      else if (keys["KeyS"])
        carSpeed = Math.max(carSpeed - acceleration, -maxSpeed / 2);
      else carSpeed *= 0.95;

      if (keys["KeyA"]) car.rotation.y += turnSpeed;
      if (keys["KeyD"]) car.rotation.y -= turnSpeed;

      car.position.x += Math.sin(car.rotation.y) * carSpeed;
      car.position.z += Math.cos(car.rotation.y) * carSpeed;

      const camOffset = new THREE.Vector3(
        -Math.sin(car.rotation.y) * 8,
        4,
        -Math.cos(car.rotation.y) * 8
      );
      const desiredCamPos = car.position.clone().add(camOffset);
      camera.position.lerp(desiredCamPos, 0.1);
      camera.lookAt(car.position);
    }

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

main();
