// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0); // Sun position
scene.add(pointLight);

// Set background texture
const loader = new THREE.TextureLoader();
const backgroundTexture = loader.load('textures/background.jpg');
scene.background = backgroundTexture;

// Helper function to load a texture for a planet or sun
function loadTexture(texturePath) {
  return loader.load(texturePath);
}

// Helper function to create a planet with a texture
function createPlanet(size, texturePath, distance, name) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ map: loadTexture(texturePath) });
  const planet = new THREE.Mesh(geometry, material);

  // Store name as a property of the planet
  planet.name = name;

  // Create an orbit line
  if (name !== "Moon") {
    const orbit = createOrbitLine(distance);
    scene.add(orbit);
  }

  return planet;
}

// Function to create a circular orbit line
function createOrbitLine(radius) {
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  return orbitLine;
}

// Create the Sun with a texture
const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({ map: loadTexture('textures/sun.jpg') });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Scale factor to reduce orbit size
const scale = 20;

// Planets data [size, texture, distance in AU, name]
const planetsData = [
  [0.3, 'textures/mercury.jpg', 0.39 * scale, 'Mercury'],   // Mercury
  [0.5, 'textures/venus.jpg', 0.72 * scale, 'Venus'],       // Venus
  [0.5, 'textures/earth.jpg', 1.00 * scale, 'Earth'],       // Earth
  [0.4, 'textures/mars.jpg', 1.52 * scale, 'Mars'],         // Mars
  [0.9, 'textures/jupiter.jpg', 5.20 * scale, 'Jupiter'],   // Jupiter
  [0.7, 'textures/saturn.jpg', 9.58 * scale, 'Saturn'],     // Saturn
  [0.6, 'textures/uranus.jpg', 19.22 * scale, 'Uranus'],    // Uranus
  [0.5, 'textures/neptune.jpg', 30.05 * scale, 'Neptune']   // Neptune
];

// Add planets and orbits
const planets = planetsData.map(data => {
  const planet = createPlanet(data[0], data[1], data[2], data[3]);

  // Randomly position each planet on its orbit
  const randomAngle = Math.random() * Math.PI * 2;
  planet.position.x = data[2] * Math.cos(randomAngle); // Circular orbit, x-axis
  planet.position.z = data[2] * Math.sin(randomAngle); // Circular orbit, z-axis

  scene.add(planet);
  return planet;
});

// Adjustments to Moon: Larger size and visible orbit
const moonDistance = 0.25 * scale; // Distance from Earth to Moon
const moonSize = 0.15;            // Increase Moon size
const moonTexture = 'textures/moon.jpg';
const moon = createPlanet(moonSize, moonTexture, moonDistance, 'Moon');

// Set Moon's orbit around Earth (using Earth's position as reference)
let moonOrbitAngle = 0; // Starting angle for the Moon's orbit

// Create Moon's orbit line around Earth
const moonOrbitLine = createOrbitLine(moonDistance);
scene.add(moonOrbitLine);

function updateMoonPosition() {
  const earth = planets.find(planet => planet.name === 'Earth');

  // Adjust the Moon's speed and orbit direction
  const moonSpeed = 0.02; // Adjust this value to slow down the Moon's orbit
  moonOrbitAngle -= moonSpeed; // Make the Moon orbit counter-clockwise

  // Update Moon's position relative to Earth
  moon.position.x = earth.position.x + moonDistance * Math.cos(moonOrbitAngle); // Orbit around Earth
  moon.position.z = earth.position.z + moonDistance * Math.sin(moonOrbitAngle); // Orbit around Earth

  // Update the orbit line's position to the Moon's orbit
  moonOrbitLine.position.set(earth.position.x, earth.position.y, earth.position.z);

  scene.add(moon);
}

// Function to create a text sprite for the planet name with higher resolution
function createTextSprite(message) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set higher resolution by increasing the canvas size
  const fontSize = 32;
  context.font = `Bold ${fontSize}px Helvetica`;
  const textWidth = context.measureText(message).width;

  // Set canvas size based on text size with a scaling factor
  const scaleFactor = 2; // Scale for higher resolution
  canvas.width = (textWidth + 20) * scaleFactor; // Add some padding
  canvas.height = (fontSize + 10) * scaleFactor; // Add some padding

  // Set the context scale for higher resolution
  context.scale(scaleFactor, scaleFactor);

  context.fillStyle = 'rgba(255, 255, 255, 0)'; // Semi-transparent white background
  context.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
  
  context.fillStyle = 'white'; // Text color
  context.fillText(message, 10, fontSize * scaleFactor / 2); // Draw text

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(6, 3, 1); // Scale the sprite for larger text
  
  return sprite;
}

// Create a sprite for each planet and position it above the planet
const planetSprites = planets.map(planet => {
  const sprite = createTextSprite(planet.name);
  
  // Position the sprite centered and slightly above the planet
  sprite.position.set(planet.position.x, planet.position.y + 0.7, planet.position.z);
  scene.add(sprite);
  
  return sprite;
});

// Camera positioning
camera.position.z = 50;

// Orbit controls for zoom and rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Raycaster and mouse for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Detecting clicks on planets and showing planet name
function onMouseClick(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1 for both axes)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate intersects with planets and the Moon
  const allBodies = [...planets, moon]; // Include Moon in the clickable objects
  const intersects = raycaster.intersectObjects(allBodies);

  if (intersects.length > 0) {
    const clickedBody = intersects[0].object;
    console.log(`You clicked on ${clickedBody.name}`);
  }
}

// Add event listener for mouse clicks
window.addEventListener('click', onMouseClick);

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  // Update Moon position around Earth
  updateMoonPosition();

  // Simple rotation for planets
  planets.forEach((planet, index) => {
    planet.rotation.y += 0.01;
    // Update sprite position
    planetSprites[index].position.set(planet.position.x, planet.position.y + 0.7, planet.position.z); // Adjust the sprite position
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
