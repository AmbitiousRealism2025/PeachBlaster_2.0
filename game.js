// --- Globals & Constants ---
let scene, camera, renderer; let playerShip;
const peaches = []; const playerBullets = []; const explosionParticles = [];
let score = 0; let lives = 3; let gameOver = false; let gameRunning = false; let gameInitialized = false; let keysPressed = {}; const clock = new THREE.Clock();
const PLAYER_ROTATION_SPEED = Math.PI * 2.0; const PLAYER_ACCELERATION = 45; const PLAYER_MAX_SPEED = 50; const PLAYER_DAMPING = 0.6;
const BULLET_SPEED = 80; const PEACH_MIN_SPEED = 5; const PEACH_MAX_SPEED = 15; const SLICE_SPEED_MULTIPLIER = 1.5; const MAX_PEACHES = 7; const PEACH_SPAWN_INTERVAL = 2500; const PLAYER_SHOOT_COOLDOWN = 200;
const WORLD_WIDTH = 190; const WORLD_HEIGHT = 110;
// Score and Peach Count Constants
const SCORE_LARGE_PEACH = 20;
const SCORE_MEDIUM_PEACH = 50;
const SCORE_SMALL_PEACH = 100;
const MEDIUM_PEACHES_FROM_LARGE = 2;
const SMALL_PEACHES_FROM_MEDIUM = 3;
const PLAYER_INVINCIBILITY_FLASH_INTERVAL = 100;
let lastPeachSpawnTime = 0; let lastPlayerShootTime = 0; let countdownInterval = null;

// Starfield Constants
const NUM_STARS = 650; const STAR_BASE_SIZE = 0.4; const STAR_OPACITY = 0.7; const BASE_BLINK_OPACITY = 0.1; const BLINK_MAX_OPACITY = 1.0; const BLINK_DURATION = 0.85; const MAX_BLINKING_STARS = 5; const BLINK_CHECK_INTERVAL = 0.25; const BLINK_CHANCE = 0.45; const HIDDEN_POS_VALUE = NaN;
let starfieldObject = null; let starPositionsAttribute = null; let originalStarPositions = []; let blinkerPool = []; let activeBlinks = []; let lastBlinkCheckTime = 0;

// Peach Texture Cache
const peachTextureCache = {};

// Explosion Constants
const EXPLOSION_PARTICLE_COUNT = 25; const EXPLOSION_PARTICLE_SIZE = 0.5; const EXPLOSION_MIN_SPEED = 20; const EXPLOSION_MAX_SPEED = 60; const EXPLOSION_LIFESPAN = 0.7; const EXPLOSION_DAMPING = 0.1;

// Thruster Constants
const THRUSTER_BASE_WIDTH = 0.7; const THRUSTER_BASE_LENGTH = 0.7; const THRUSTER_MAX_LENGTH_SCALE = 4.0; const THRUSTER_RAMP_UP_SPEED = 2.5; const THRUSTER_RAMP_DOWN_SPEED = 3.5; const THRUSTER_VISIBLE_THRESHOLD = 0.01;

// Planet Constants
const PLANET_RADIUS = 10;
const PLANET_COLOR_LIGHT = "#87CEEB";
const PLANET_COLOR_DARK = "#4682B4";
const PLANET_POSITION_X_FACTOR = 0.65;
const PLANET_POSITION_Y_FACTOR = -0.5;
const PLANET_POSITION_Z = -230;

// --- WebGL Check ---
function isWebGLAvailable() { try { const canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); } catch ( e ) { return false; } }

// --- Splash / Start Logic ---
function showSplashScreen() { 
    if (!isWebGLAvailable()) { 
        console.error("WebGL check failed!"); 
        document.getElementById('webgl-error').style.display = 'block'; 
        return; 
    } 
    console.log("DEBUG: WebGL check passed."); 
    document.getElementById('splashScreen').style.display = 'flex'; 
    document.getElementById('info').style.display = 'none'; 
    document.getElementById('gameOver').style.display = 'none'; 
    document.getElementById('countdown').style.display = 'none'; 
    // Attempt to focus the window
    window.focus();
    // Ensure Spacebar handler is attached
    window.removeEventListener("keydown", handleInitialSplashInput); // Remove any previous listener
    window.addEventListener("keydown", handleInitialSplashInput);
    console.log("[PeachBlaster] Spacebar event listener attached for initial splash");
}

// --- startCountdown Function Definition ---
function startCountdown() { console.log(">>> startCountdown - Entered <<<");
    let count = 5;
    const el = document.getElementById("countdown");
    if (!el) {
        console.error("!!! CRITICAL: Countdown DIV not found!");
        return;
    }
    console.log("startCountdown - Countdown element found. display=" + el.style.display);
    try {
        el.style.display = "block";
        el.textContent = count;
        console.log("startCountdown - Element displayed, text set:", count);
    } catch (e) {
        console.error("!!! Error setting countdown display/text:", e);
        setTimeout(startGameplay, 5000);
        return;
    }
    if (countdownInterval) {
        console.log("startCountdown - Clearing previous interval:", countdownInterval);
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    console.log(">>> startCountdown - Attempting to set setInterval <<<");
    try {
        countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if (el) el.textContent = count;
            } else {
                console.log("Interval - Countdown finished.");
                if (countdownInterval) clearInterval(countdownInterval);
                countdownInterval = null;
                if (el) el.style.display = "none";
                console.log("Interval - Calling startGameplay().");
                startGameplay();
            }
        }, 1000);
        console.log("startCountdown - setInterval returned id:", countdownInterval);
        if (!countdownInterval) {
            console.error("!!! startCountdown - setInterval failed!");
            alert("Error: Failed to schedule countdown.");
        }
    } catch (e) {
        console.error("!!! Error setting interval:", e);
        alert("Error: Could not start countdown timer.");
}
    }

// --- Game Start Logic ---
function startGameplay() { if (!renderer) { console.error("!!! startGameplay - Renderer missing!"); return; } console.log(">>> startGameplay - Entered <<<"); resetGameState(); clearGameObjects(); console.log("DEBUG: Resetting starfield blinks (Cleaned Up)."); resetStarfieldBlinks(); console.log("startGameplay - Creating player..."); playerShip = createPlayer(); if (playerShip && scene) { scene.add(playerShip); console.log("startGameplay - Player added."); } else { console.error("!!! startGameplay - Failed player create or scene missing!"); return; } console.log("startGameplay - Spawning peaches..."); spawnInitialPeaches(3); console.log(`startGameplay - Peaches array length: ${peaches.length}`); updateUI(); document.getElementById('info').style.display = 'block'; document.getElementById('gameOver').style.display = 'none'; gameRunning = true; gameOver = false; console.log(`startGameplay - gameRunning=${gameRunning}, gameOver=${gameOver}.`); console.log("startGameplay - Resetting clock..."); clock.start(); clock.getDelta(); lastBlinkCheckTime = clock.elapsedTime; console.log(">>> startGameplay - Calling animate() for the FIRST time... <<<"); animate(); console.log(">>> startGameplay - Exiting function. <<<"); }

// --- Initialization ---
function init() { if (gameInitialized) return; console.log("DEBUG: init - Initializing..."); renderer = null; try { scene = new THREE.Scene(); const aspect = window.innerWidth / window.innerHeight; camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000); camera.position.z = 70; try { console.log("DEBUG: init - Creating renderer..."); const tempRenderer = new THREE.WebGLRenderer({ antialias: true }); tempRenderer.setSize(window.innerWidth, window.innerHeight); tempRenderer.setClearColor(0x020005); document.body.appendChild(tempRenderer.domElement); renderer = tempRenderer; console.log("DEBUG: init - Renderer created."); } catch (e) { console.error("!!! WebGL Init Error:", e); return; } const ambientLight = new THREE.AmbientLight(0x9999AA, 0.7); scene.add(ambientLight); const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); directionalLight.position.set(10, 15, 12); scene.add(directionalLight); starfieldObject = createStarfield(); if (starfieldObject) { starPositionsAttribute = starfieldObject.geometry.getAttribute('position'); scene.add(starfieldObject); console.log("DEBUG: Starfield created and added."); } else { console.error("!!! Failed to create starfield object!"); } createBlinkerPool(); createSinglePlanet(); window.addEventListener('resize', onWindowResize); window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); gameInitialized = true; console.log("DEBUG: init - Initialized Successfully."); } catch (majorInitError) { console.error("DEBUG: !!! MAJOR Error during init !!!", majorInitError); if (renderer && renderer.domElement && renderer.domElement.parentNode) { renderer.domElement.parentNode.removeChild(renderer.domElement); } renderer = null; alert("A critical error occurred during game initialization."); } }

// --- Game State & Object Management ---
function resetGameState() { score = 0; lives = 3; lastPeachSpawnTime = Date.now(); lastPlayerShootTime = 0; keysPressed = {}; }
function clearGameObjects() { console.log("DEBUG: clearGameObjects called"); let count = 0; while (peaches.length > 0) { removeObject(peaches.pop()); count++; } while (playerBullets.length > 0) { removeObject(playerBullets.pop()); count++; } while (explosionParticles.length > 0) { removeObject(explosionParticles.pop()); count++; } if (playerShip) { removeObject(playerShip); playerShip = null; count++; } console.log(`DEBUG: clearGameObjects removed ${count} game objects.`); }
function removeObject(object) { if (!object) return; if (object.parent) object.parent.remove(object); if (object.geometry) object.geometry.dispose(); if (object.material) { if (Array.isArray(object.material)) { object.material.forEach(mat => { if(mat.map) { mat.map.dispose(); } mat.dispose(); }); } else { if(object.material.map) { object.material.map.dispose(); } object.material.dispose(); } } }

// --- Object Creation Functions ---
function createPeachBaseTexture(sizeCategory) { if (peachTextureCache[sizeCategory]) { return peachTextureCache[sizeCategory]; } console.log(`DEBUG: Creating new peach texture for size: ${sizeCategory}`); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const size = 128; canvas.width = size; canvas.height = size; let baseColor, lightColor, darkColor, fuzzColor; switch (sizeCategory) { case 'medium': baseColor = '#FFA07A'; lightColor = '#FFDAB9'; darkColor = '#CD853F'; fuzzColor = 'rgba(245, 222, 179, 0.3)'; break; case 'small': baseColor = '#B87333'; lightColor = '#D2B48C'; darkColor = '#8B4513'; fuzzColor = 'rgba(210, 180, 140, 0.3)'; break; case 'large': default: baseColor = '#FF8C00'; lightColor = '#FFA500'; darkColor = '#D2691E'; fuzzColor = 'rgba(255, 228, 181, 0.3)'; break; } const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.6); gradient.addColorStop(0, lightColor); gradient.addColorStop(0.7, baseColor); gradient.addColorStop(1, darkColor); ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size); const imageData = ctx.getImageData(0, 0, size, size); const data = imageData.data; const fuzzAmount = 25; for (let i = 0; i < data.length; i += 4) { const noise = (Math.random() - 0.5) * fuzzAmount; data[i] = Math.max(0, Math.min(255, data[i] + noise)); data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); } ctx.putImageData(imageData, 0, 0); ctx.beginPath(); ctx.moveTo(size * 0.45, size * 0.1); ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.45, size * 0.9); ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; ctx.lineWidth = size * 0.03; ctx.stroke(); ctx.beginPath(); ctx.moveTo(size * 0.55, size * 0.1); ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.55, size * 0.9); ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = size * 0.02; ctx.stroke(); const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; peachTextureCache[sizeCategory] = texture; return texture; }
function createPlayer() { const playerGroup = new THREE.Group(); const shipColor = 0xC0D0FF; const cockpitColor = 0xFFE060; const thrusterColor = 0xFFB000; const lineColor = 0x003366; const bodyScale = 1.0; const noseY = 3.0 * bodyScale; const shoulderX = 0.6 * bodyScale; const shoulderY = 1.8 * bodyScale; const wingTipX = 2.8 * bodyScale; const wingTipY = -1.5 * bodyScale; const wingRootX = 1.0 * bodyScale; const wingRootY = -2.5 * bodyScale; const centerRearY = -2.2 * bodyScale; const vertices = [ new THREE.Vector2(0, noseY), new THREE.Vector2(-shoulderX, shoulderY), new THREE.Vector2(-wingTipX, wingTipY), new THREE.Vector2(-wingRootX, wingRootY), new THREE.Vector2(0, centerRearY), new THREE.Vector2(wingRootX, wingRootY), new THREE.Vector2(wingTipX, wingTipY), new THREE.Vector2(shoulderX, shoulderY), ]; const bodyShape = new THREE.Shape(); bodyShape.moveTo(vertices[0].x, vertices[0].y); for (let i = 1; i < vertices.length; i++) { bodyShape.lineTo(vertices[i].x, vertices[i].y); } bodyShape.lineTo(vertices[0].x, vertices[0].y); const bodyGeom = new THREE.ShapeGeometry(bodyShape); const bodyMat = new THREE.MeshBasicMaterial({ color: shipColor, side: THREE.DoubleSide }); const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat); bodyMesh.name = "playerBody"; playerGroup.add(bodyMesh); const lineMat = new THREE.LineBasicMaterial({ color: lineColor }); const centerLinePoints = [ new THREE.Vector3(0, noseY * 0.95, 0.1), new THREE.Vector3(0, centerRearY * 0.9, 0.1) ]; const centerLineGeom = new THREE.BufferGeometry().setFromPoints(centerLinePoints); const centerLine = new THREE.Line(centerLineGeom, lineMat); playerGroup.add(centerLine); const leftWingLinePoints = [ new THREE.Vector3(vertices[1].x, vertices[1].y, 0.1), new THREE.Vector3(vertices[2].x, vertices[2].y, 0.1) ]; const leftWingLineGeom = new THREE.BufferGeometry().setFromPoints(leftWingLinePoints); const leftWingLine = new THREE.Line(leftWingLineGeom, lineMat); playerGroup.add(leftWingLine); const rightWingLinePoints = [ new THREE.Vector3(vertices[7].x, vertices[7].y, 0.1), new THREE.Vector3(vertices[6].x, vertices[6].y, 0.1) ]; const rightWingLineGeom = new THREE.BufferGeometry().setFromPoints(rightWingLinePoints); const rightWingLine = new THREE.Line(rightWingLineGeom, lineMat); playerGroup.add(rightWingLine); const cockpitW = 0.6 * bodyScale; const cockpitH = 0.8 * bodyScale; const cockpitGeom = new THREE.PlaneGeometry(cockpitW, cockpitH); const cockpitMat = new THREE.MeshBasicMaterial({ color: cockpitColor }); const cockpitMesh = new THREE.Mesh(cockpitGeom, cockpitMat); cockpitMesh.position.set(0, noseY * 0.65, 0.15); cockpitMesh.name = "playerCockpit"; playerGroup.add(cockpitMesh); const thrusterGeom = new THREE.PlaneGeometry(THRUSTER_BASE_WIDTH, THRUSTER_BASE_LENGTH); const thrusterMat = new THREE.MeshBasicMaterial({ color: thrusterColor, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }); const thrusterL = new THREE.Mesh(thrusterGeom, thrusterMat.clone()); thrusterL.position.set(vertices[3].x, vertices[3].y - THRUSTER_BASE_LENGTH * 0.5, 0); thrusterL.name = "playerThrusterLeft"; thrusterL.visible = false; playerGroup.add(thrusterL); const thrusterR = new THREE.Mesh(thrusterGeom, thrusterMat.clone()); thrusterR.position.set(vertices[5].x, vertices[5].y - THRUSTER_BASE_LENGTH * 0.5, 0); thrusterR.name = "playerThrusterRight"; thrusterR.visible = false; playerGroup.add(thrusterR); const collisionRadius = Math.max(noseY, wingTipX); playerGroup.userData = { velocity: new THREE.Vector3(), maxSpeed: PLAYER_MAX_SPEED, acceleration: PLAYER_ACCELERATION, rotationSpeed: PLAYER_ROTATION_SPEED, damping: PLAYER_DAMPING, shootCooldown: PLAYER_SHOOT_COOLDOWN, lastShotTime: 0, radius: collisionRadius, invincible: false, invincibleTimer: 0, thrusterLeft: thrusterL, thrusterRight: thrusterR, currentThrustIntensity: 0.0 }; playerGroup.rotation.order = 'ZYX'; playerGroup.position.set(0, 0, 0); console.log(`DEBUG: Created player ship V3 with radius: ${collisionRadius.toFixed(2)}`); return playerGroup; }
function createPeach(sizeCategory, position, velocity) { let r; switch (sizeCategory) { case 'medium': r = 3 + Math.random()*1; break; case 'small': r = 1.5 + Math.random()*0.5; break; case 'large': default: r = 5 + Math.random()*2; break; } const geom = new THREE.SphereGeometry(r, 16, 12); const peachTexture = createPeachBaseTexture(sizeCategory); const mat = new THREE.MeshStandardMaterial({ map: peachTexture, roughness: 0.8, metalness: 0.1, }); const mesh = new THREE.Mesh(geom, mat); if (!position) { position = new THREE.Vector3(); const edge = Math.floor(Math.random()*4); const buffer = r+2; if (edge===0) position.set(THREE.MathUtils.randFloatSpread(WORLD_WIDTH), WORLD_HEIGHT/2+buffer, 0); else if (edge===1) position.set(THREE.MathUtils.randFloatSpread(WORLD_WIDTH), -WORLD_HEIGHT/2-buffer, 0); else if (edge===2) position.set(-WORLD_WIDTH/2-buffer, THREE.MathUtils.randFloatSpread(WORLD_HEIGHT), 0); else position.set(WORLD_WIDTH/2+buffer, THREE.MathUtils.randFloatSpread(WORLD_HEIGHT), 0); } mesh.position.copy(position); if (!velocity) { const angle = Math.random()*Math.PI*2; const speed = THREE.MathUtils.randFloat(PEACH_MIN_SPEED, PEACH_MAX_SPEED); velocity = new THREE.Vector3(Math.cos(angle)*speed, Math.sin(angle)*speed, 0); } mesh.userData = { velocity: velocity, radius: r, sizeCategory: sizeCategory }; mesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2); return mesh; }
function breakPeach(h){ const i=peaches.indexOf(h); if(i===-1) return; const s=h.userData.sizeCategory, p=h.position.clone(), o=h.userData.velocity; removeObject(h); peaches.splice(i,1); let n, l=0, c=0; if(s==='large'){ n='medium'; l=MEDIUM_PEACHES_FROM_LARGE; c=SCORE_LARGE_PEACH; } else if(s==='medium'){ n='small'; l=SMALL_PEACHES_FROM_MEDIUM; c=SCORE_MEDIUM_PEACH; } else { c=SCORE_SMALL_PEACH; } updateScore(c); for(let k=0; k<l; k++){ const a=(Math.PI*2*k/l)+THREE.MathUtils.randFloatSpread(0.5); const b=SLICE_SPEED_MULTIPLIER+Math.random()*0.5; const v=new THREE.Vector3(o.x*0.5+Math.cos(a)*(PEACH_MAX_SPEED*b*0.5), o.y*0.5+Math.sin(a)*(PEACH_MAX_SPEED*b*0.5), 0); const S=createPeach(n, p.clone(), v); if(n==='medium'||n==='small'){ peaches.push(S); if(scene) scene.add(S); } } }
function createBullet(position, direction, isPlayerBullet) {
    let bulletRadius;
    let bulletColor;

    if (isPlayerBullet) {
        bulletRadius = 0.6; // Player bullet radius
        bulletColor = 0xffff00; // Player bullet color (yellow)
    } else {
        bulletRadius = 0.5; // Enemy bullet radius
        bulletColor = 0x00ff00; // Enemy bullet color (green)
    }

    const geometry = new THREE.SphereGeometry(bulletRadius, 8, 8); // Segment counts (8,8) are kept as they are minor details
    const material = new THREE.MeshBasicMaterial({ color: bulletColor });
    const bulletMesh = new THREE.Mesh(geometry, material);

    bulletMesh.position.copy(position);
    bulletMesh.userData = {
        velocity: direction.clone().multiplyScalar(BULLET_SPEED),
        radius: bulletRadius,
        isPlayerBullet: isPlayerBullet 
    };
    return bulletMesh;
}
function createStarfield(numStars = NUM_STARS, width = WORLD_WIDTH * 1.5, height = WORLD_HEIGHT * 1.5, depth = 50) { const vertices = []; originalStarPositions = []; for (let i = 0; i < numStars; i++) { const x = THREE.MathUtils.randFloatSpread(width); const y = THREE.MathUtils.randFloatSpread(height); const z = THREE.MathUtils.randFloat(-depth, -10); vertices.push(x, y, z); originalStarPositions.push(x, y, z); } const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); const mat = new THREE.PointsMaterial({ color: 0xffffff, size: STAR_BASE_SIZE, sizeAttenuation: true, transparent: true, opacity: STAR_OPACITY, vertexColors: false, depthWrite: true }); const stars = new THREE.Points(geom, mat); stars.name = "Starfield"; return stars; }
function createBlinkerPool() { console.log(`DEBUG: Creating blinker pool with ${MAX_BLINKING_STARS} objects.`); blinkerPool = []; const blinkerGeom = new THREE.BufferGeometry(); blinkerGeom.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)); for (let i = 0; i < MAX_BLINKING_STARS; i++) { const blinkerMat = new THREE.PointsMaterial({ color: 0xffffff, size: STAR_BASE_SIZE * 1.2, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: true }); const blinkerPoint = new THREE.Points(blinkerGeom, blinkerMat); blinkerPoint.visible = false; blinkerPoint.name = `Blinker_${i}`; blinkerPool.push(blinkerPoint); scene.add(blinkerPoint); } }
function createSinglePlanet() { console.log("DEBUG: Creating single distant planet with gradient and rings..."); const canvasSize = 128; // This can remain as it's specific to texture generation detail const canvas = document.createElement('canvas'); canvas.width = canvasSize; canvas.height = canvasSize; const context = canvas.getContext('2d'); const gradient = context.createLinearGradient(0, 0, 0, canvasSize); gradient.addColorStop(0, PLANET_COLOR_LIGHT); gradient.addColorStop(1, PLANET_COLOR_DARK); context.fillStyle = gradient; context.fillRect(0, 0, canvasSize, canvasSize); const planetTexture = new THREE.CanvasTexture(canvas); planetTexture.needsUpdate = true; const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 32, 24); // 32, 24 are segment counts, can be left as magic numbers for geometry detail const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture, roughness: 0.8, metalness: 0.1 }); const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial); planetMesh.name = "PlanetBody"; planetMesh.rotation.z = -Math.PI / 16; // Small rotational offset, can be left or made a constant if it's a themed value const ringDefs = [ { inner: PLANET_RADIUS * 1.2, outer: PLANET_RADIUS * 1.6, color: 0xC1B5A9 }, { inner: PLANET_RADIUS * 1.6, outer: PLANET_RADIUS * 1.68, color: 0x181818 }, { inner: PLANET_RADIUS * 1.68, outer: PLANET_RADIUS * 2.2, color: 0xAD9F93 }, { inner: PLANET_RADIUS * 2.2, outer: PLANET_RADIUS * 2.4, color: 0x948B80, opacity: 0.8 }, ]; const planetGroup = new THREE.Group(); planetGroup.add(planetMesh); const ringTiltY = Math.PI / 7; // Ring tilt, can be left or made a constant ringDefs.forEach((def, index) => { const ringGeometry = new THREE.RingGeometry(def.inner, def.outer, 64); // 64 is segment count for ring const ringMaterial = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.85, metalness: 0.1, side: THREE.DoubleSide, transparent: def.opacity < 1.0, opacity: def.opacity !== undefined ? def.opacity : 1.0 }); const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial); ringMesh.rotation.x = Math.PI / 2; // Align ring to be horizontal ringMesh.rotation.y = ringTiltY; ringMesh.name = `PlanetRing_${index}`; planetGroup.add(ringMesh); }); const posX = WORLD_WIDTH * PLANET_POSITION_X_FACTOR; const posY = WORLD_HEIGHT * PLANET_POSITION_Y_FACTOR; planetGroup.position.set(posX, posY, PLANET_POSITION_Z); planetGroup.rotation.z = Math.PI / 10; // Small overall rotation planetGroup.rotation.x = -Math.PI / 24; // Small overall tilt planetGroup.name = "DistantPlanet"; scene.add(planetGroup); console.log(`DEBUG: Added DistantPlanet group at Z=${PLANET_POSITION_Z}`); }

// --- Starfield Blinking Logic ---
function updateStarfieldBlinks(deltaTime) { const NaNValue = NaN; if (!starfieldObject || !starPositionsAttribute || blinkerPool.length === 0) return; const now = clock.elapsedTime; let mainPositionsNeedUpdate = false; for (let i = activeBlinks.length - 1; i >= 0; i--) { const blink = activeBlinks[i]; const blinkerObject = blinkerPool[blink.poolIndex]; blink.timer += deltaTime; if (blink.timer >= BLINK_DURATION) { blinkerObject.visible = false; blinkerObject.material.opacity = 0; const originalX = originalStarPositions[blink.originalIndex * 3]; const originalY = originalStarPositions[blink.originalIndex * 3 + 1]; const originalZ = originalStarPositions[blink.originalIndex * 3 + 2]; starPositionsAttribute.setXYZ(blink.originalIndex, originalX, originalY, originalZ); mainPositionsNeedUpdate = true; activeBlinks.splice(i, 1); } else { const progress = blink.timer / BLINK_DURATION; let opacityFactor; if (progress < 0.5) { opacityFactor = 1.0 - (progress * 2); } else { opacityFactor = (progress - 0.5) * 2; } const opacity = BASE_BLINK_OPACITY + (BLINK_MAX_OPACITY - BASE_BLINK_OPACITY) * opacityFactor; blinkerObject.material.opacity = opacity; } } const timeSinceLastCheck = now - lastBlinkCheckTime; if (timeSinceLastCheck > BLINK_CHECK_INTERVAL) { lastBlinkCheckTime = now; const blinkRoll = Math.random(); if (activeBlinks.length < MAX_BLINKING_STARS && blinkRoll < BLINK_CHANCE) { let availablePoolIndex = -1; for(let i = 0; i < blinkerPool.length; i++) { if (!blinkerPool[i].visible) { availablePoolIndex = i; break; } } if (availablePoolIndex !== -1) { let originalIndex = -1; let attempts = 0; let foundValidStar = false; while (attempts < 50) { const potentialIndex = Math.floor(Math.random() * NUM_STARS); const isNotActive = !activeBlinks.some(b => b.originalIndex === potentialIndex); const isVisible = !isNaN(starPositionsAttribute.getX(potentialIndex)); if (isNotActive && isVisible) { originalIndex = potentialIndex; foundValidStar = true; break; } attempts++; } if (foundValidStar) { const blinkerObject = blinkerPool[availablePoolIndex]; const originalX = starPositionsAttribute.getX(originalIndex); const originalY = starPositionsAttribute.getY(originalIndex); const originalZ = starPositionsAttribute.getZ(originalIndex); blinkerObject.position.set(originalX, originalY, originalZ); blinkerObject.material.opacity = BLINK_MAX_OPACITY; blinkerObject.visible = true; starPositionsAttribute.setXYZ(originalIndex, NaNValue, NaNValue, NaNValue); mainPositionsNeedUpdate = true; activeBlinks.push({ originalIndex: originalIndex, poolIndex: availablePoolIndex, timer: 0 }); } } } } if (mainPositionsNeedUpdate) { starPositionsAttribute.needsUpdate = true; } }
function resetStarfieldBlinks() { let mainPositionsNeedUpdate = false; let restoredCount = 0; if (starPositionsAttribute && originalStarPositions.length === NUM_STARS * 3) { for (let i = 0; i < NUM_STARS; i++) { const originalX = originalStarPositions[i * 3]; const originalY = originalStarPositions[i * 3 + 1]; const originalZ = originalStarPositions[i * 3 + 2]; starPositionsAttribute.setXYZ(i, originalX, originalY, originalZ); restoredCount++; } mainPositionsNeedUpdate = true; } else { console.error("!!! Cannot reset star positions: Attribute or original positions missing/invalid!"); } let hiddenBlinkers = 0; blinkerPool.forEach((blinker, index) => { blinker.visible = false; if(blinker.material) blinker.material.opacity = 0; hiddenBlinkers++; }); const oldActiveBlinksCount = activeBlinks.length; activeBlinks = []; const resetTime = clock.elapsedTime; lastBlinkCheckTime = resetTime; if (mainPositionsNeedUpdate && starPositionsAttribute) { starPositionsAttribute.needsUpdate = true; } }

// --- Game Loop & Updates ---
function animate() { if (!gameRunning) return; requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), 0.1); try { updatePlayer(dt); updateBullets(dt, playerBullets); updatePeaches(dt); updateStarfieldBlinks(dt); handleSpawning(); detectCollisions(); } catch (e) { console.error("!!! animate - Error during UPDATE !!!", e); gameRunning = false; endGame(); return; } if (renderer && scene && camera) { try { renderer.render(scene, camera); } catch(e) { console.error("!!! animate - Error during RENDER !!!", e); gameRunning = false; endGame(); } } else if (gameRunning) { console.error("!!! animate - Render components missing!"); gameRunning = false; endGame(); } }

// --- FIXED: updatePlayer removed bad vertex reference ---
function updatePlayer(dt) {
    if (!playerShip || !playerShip.userData) return;
    const d = playerShip.userData;
    const thrusterL = d.thrusterLeft;
    const thrusterR = d.thrusterRight;

    // Rotation
    if (keysPressed['a'] || keysPressed['arrowleft']) playerShip.rotation.z += d.rotationSpeed * dt;
    if (keysPressed['d'] || keysPressed['arrowright']) playerShip.rotation.z -= d.rotationSpeed * dt;

    // Thrusting & Intensity Update
    let isThrustingKeyDown = keysPressed['w'] || keysPressed['arrowup'];
    if (isThrustingKeyDown) {
        d.currentThrustIntensity = Math.min(1.0, d.currentThrustIntensity + THRUSTER_RAMP_UP_SPEED * dt);
        const forwardVector = new THREE.Vector3(0, 1, 0);
        forwardVector.applyQuaternion(playerShip.quaternion);
        d.velocity.add(forwardVector.multiplyScalar(d.acceleration * dt));
    } else {
        d.currentThrustIntensity = Math.max(0.0, d.currentThrustIntensity - THRUSTER_RAMP_DOWN_SPEED * dt);
    }

    // Thruster Visuals (Length and Visibility)
    if (thrusterL && thrusterR) {
         const isVisible = d.currentThrustIntensity > THRUSTER_VISIBLE_THRESHOLD;
         thrusterL.visible = isVisible;
         thrusterR.visible = isVisible;

         if (isVisible) {
             const targetScaleY = 1.0 + (THRUSTER_MAX_LENGTH_SCALE - 1.0) * d.currentThrustIntensity;
             thrusterL.scale.y = targetScaleY;
             thrusterR.scale.y = targetScaleY;

             // --- REMOVED FAULTY POSITION ADJUSTMENT ---
             // Scaling happens from the center origin of the PlaneGeometry,
             // which was positioned just below the wing root in createPlayer.
             // This visually extends the plane downwards.
         }
    }

    // Damping & Speed Limit
    d.velocity.multiplyScalar(Math.max(0, 1 - d.damping * dt));
    if (d.velocity.lengthSq() > d.maxSpeed * d.maxSpeed) {
        d.velocity.normalize().multiplyScalar(d.maxSpeed);
    }

    // Movement & Screen Wrap
    if (d.velocity.lengthSq() > 0.001) { playerShip.position.add(d.velocity.clone().multiplyScalar(dt)); }
    wrapAroundScreen(playerShip.position, d.radius);

    // Shooting
    if (keysPressed[' '] || keysPressed['spacebar']) { const n = Date.now(); if (n - d.lastShotTime > d.shootCooldown) { shoot(playerShip, true); d.lastShotTime = n; } }

    // Invincibility Flash
    if (d.invincible) { d.invincibleTimer -= dt * 1000; const body = playerShip.getObjectByName("playerBody"); if (body) { body.visible = Math.floor(d.invincibleTimer / PLAYER_INVINCIBILITY_FLASH_INTERVAL) % 2 === 0; } else { playerShip.visible = Math.floor(d.invincibleTimer / PLAYER_INVINCIBILITY_FLASH_INTERVAL) % 2 === 0; } if (d.invincibleTimer <= 0) { d.invincible = false; if (body) body.visible = true; else playerShip.visible = true; } } else { const body = playerShip.getObjectByName("playerBody"); if (body) body.visible = true; else playerShip.visible = true; }
}

function updateBullets(dt, arr) { const removeIdx = []; const margin = 10; for (let i=arr.length-1; i>=0; i--) { const b=arr[i]; if (!b || !b.userData) continue; b.position.add(b.userData.velocity.clone().multiplyScalar(dt)); if (Math.abs(b.position.x) > WORLD_WIDTH/2+margin || Math.abs(b.position.y) > WORLD_HEIGHT/2+margin) removeIdx.push(i); } for (let i = removeIdx.length-1; i >= 0; i--) { const idx = removeIdx[i]; if (arr[idx]) removeObject(arr[idx]); arr.splice(idx, 1); } }
function updatePeaches(dt) { peaches.forEach((h) => { if (!h || !h.userData || !h.position) return; if (h.userData.velocity.lengthSq() > 0.001) h.position.add(h.userData.velocity.clone().multiplyScalar(dt)); h.rotation.x += 0.1*dt*(h.userData.velocity.length()/PEACH_MAX_SPEED); h.rotation.y += 0.15*dt*(h.userData.velocity.length()/PEACH_MAX_SPEED); wrapAroundScreen(h.position, h.userData.radius); }); }
function handleSpawning() { if (!gameRunning) return; const n = Date.now(); if (peaches.length < MAX_PEACHES && n - lastPeachSpawnTime > PEACH_SPAWN_INTERVAL) { const h = createPeach('large'); peaches.push(h); if(scene) scene.add(h); lastPeachSpawnTime = n; } }
function handleKeyDown(event) {
    const splash = document.getElementById('splashScreen');
    const controls = document.getElementById('controlsScreen');
    // If splash is visible OR game isn't running AND game over screen isn't visible, ignore key presses
    if ((splash && splash.style.display !== 'none') || 
        (controls && controls.style.display !== 'none') || 
        (!gameRunning && (!document.getElementById('gameOver') || document.getElementById('gameOver').style.display === 'none'))) {
        return; 
    }

    // If we reach here, splash is hidden and game *should* be running
    const k = event.key.toLowerCase();
    keysPressed[k] = true;
    // Prevent default browser action for game keys (scrolling, etc.)
    if ([' ', 'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        event.preventDefault();
    }
}
function handleKeyUp(event) { const k = event.key.toLowerCase(); keysPressed[k] = false; }
function shoot(shooter, isPlayer) { if (!shooter || !shooter.userData) return; const offset = (shooter.userData.radius||2)+1; const dir = new THREE.Vector3(0, 1, 0); dir.applyQuaternion(shooter.quaternion).normalize(); const pos = shooter.position.clone().add(dir.clone().multiplyScalar(offset)); const bullet = createBullet(pos, dir, isPlayer); if (isPlayer) playerBullets.push(bullet); if(scene) scene.add(bullet); else console.error("!!! Cannot add bullet - scene missing!"); }
function detectCollisions() { if (!gameRunning || !playerShip || !playerShip.userData ) return; for (let i=playerBullets.length-1; i>=0; i--) { const b=playerBullets[i]; if (!b || !b.userData) continue; let hit=false; for (let j=peaches.length-1; j>=0; j--) { const p=peaches[j]; if (!p || !p.userData) continue; if (checkCollision(b, p)) { removeObject(b); playerBullets.splice(i, 1); breakPeach(p); hit=true; break; } } if (hit) continue; } if (!playerShip.userData.invincible) { for (let j=peaches.length-1; j>=0; j--) { const p=peaches[j]; if (!p || !p.userData) continue; if (checkCollision(playerShip, p)) { handlePlayerHit(); break; } } } }
function checkCollision(o1, o2) {
    if (!o1 || !o2 || !o1.userData || !o2.userData || !o1.position || !o2.position) return false;
    const dSq = o1.position.distanceToSquared(o2.position);
    let r1 = o1.userData.radius;
    let r2 = o2.userData.radius;
    if (r1 == null) {
        console.warn('checkCollision: object1 missing radius', o1);
        r1 = 1;
    }
    if (r2 == null) {
        console.warn('checkCollision: object2 missing radius', o2);
        r2 = 1;
    }
    const rSumSq = (r1 + r2) * (r1 + r2);
    return dSq <= rSumSq;
}
function handlePlayerHit() { if (!playerShip || !playerShip.userData || playerShip.userData.invincible) return; console.log("Player Hit!"); lives--; updateUI(); if (lives <= 0) { removeObject(playerShip); playerShip = null; endGame(); } else { playerShip.userData.invincible = true; playerShip.userData.invincibleTimer = 2000; playerShip.position.set(0,0,0); playerShip.rotation.set(0,0,0); playerShip.userData.velocity.set(0,0,0); } }
function updateScore(p) { score += p; updateUI(); }
function updateUI() { if(document.getElementById('score')) document.getElementById('score').textContent = score; if(document.getElementById('lives')) document.getElementById('lives').textContent = lives; }
function wrapAroundScreen(pos, r) { const b=r*1.5, hw=WORLD_WIDTH/2, hh=WORLD_HEIGHT/2; if (pos.x > hw+b) pos.x = -hw-b+(pos.x-(hw+b)); if (pos.x < -hw-b) pos.x = hw+b+(pos.x-(-hw-b)); if (pos.y > hh+b) pos.y = -hh-b+(pos.y-(hh+b)); if (pos.y < -hh-b) pos.y = hh+b+(pos.y-(-hh-b)); }
function onWindowResize() { if (!camera || !renderer) return; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function endGame() { console.log("DEBUG: endGame called."); gameOver = true; gameRunning = false; if (playerShip) { playerShip.visible = false; } document.getElementById('finalScore').textContent = score; document.getElementById('gameOver').style.display = 'block'; document.getElementById('info').style.display = 'none'; if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } document.getElementById('countdown').style.display = 'none'; }
function restartGame() { console.log("DEBUG: restartGame called."); document.getElementById('gameOver').style.display = 'none'; gameRunning = false; gameOver = false; if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } document.getElementById('countdown').style.display = 'none'; console.log("DEBUG: restartGame calling startGameplay..."); startGameplay(); }

// --- RE-INSERTED MISSING FUNCTION ---
function spawnInitialPeaches(count) { 
    if (!playerShip) { console.error("!!! Cannot spawn peaches - player missing!"); return;}
    const minSpawnDistSq = Math.pow((playerShip.userData.radius||3)*6, 2);
    for (let i=0; i<count; i++) { 
        let pos, attempts = 0;
        do { 
            pos = new THREE.Vector3( THREE.MathUtils.randFloatSpread(WORLD_WIDTH*0.8), THREE.MathUtils.randFloatSpread(WORLD_HEIGHT*0.8), 0 ); 
            attempts++; 
        } while (playerShip && pos.distanceToSquared(playerShip.position) < minSpawnDistSq && attempts < 30);
        
        if (attempts >= 30) { 
            console.warn("Could not place initial peach far enough from center."); 
            const edge=Math.floor(Math.random()*4), buffer=10;
            if (edge===0) pos.set(THREE.MathUtils.randFloatSpread(WORLD_WIDTH), WORLD_HEIGHT/2+buffer, 0); 
            else if (edge===1) pos.set(THREE.MathUtils.randFloatSpread(WORLD_WIDTH), -WORLD_HEIGHT/2-buffer, 0); 
            else if (edge===2) pos.set(-WORLD_WIDTH/2-buffer, THREE.MathUtils.randFloatSpread(WORLD_HEIGHT), 0); 
            else pos.set(WORLD_WIDTH/2+buffer, THREE.MathUtils.randFloatSpread(WORLD_HEIGHT), 0); 
        } 
        const peach=createPeach('large', pos);
        peaches.push(peach); 
        if(scene) scene.add(peach); 
        lastPeachSpawnTime = Date.now(); 
    } 
}

// NEW function to handle Spacebar on the *first* splash screen
function handleInitialSplashInput(event) {
    console.log(`DEBUG: handleInitialSplashInput - key='${event.key}', code='${event.code}'`);
    const initialSplash = document.getElementById('splashScreen');
    if (!initialSplash) {
        console.error('ERROR: #splashScreen element not found!');
        return;
    }
    if (initialSplash.style.display !== 'none' && (event.key === ' ' || event.code === 'Space')) {
        console.log('DEBUG: Spacebar detected on initial splash screen!');
        event.preventDefault();
        const controlsSplash = document.getElementById('controlsScreen');
        initialSplash.style.display = 'none';
        if (controlsSplash) {
            controlsSplash.style.display = 'flex';
            console.log('DEBUG: Adding handleSpaceForControls listener.');
            window.addEventListener('keydown', handleSpaceForControls);
        } else {
            console.error('ERROR: Controls screen element not found!');
        }
        console.log('DEBUG: Removing handleInitialSplashInput listener.');
        window.removeEventListener('keydown', handleInitialSplashInput);
    }
}

// Handles the Spacebar press ONLY when the controls screen is visible
function handleSpaceForControls(event) {
    const controlsVisible = document.getElementById('controlsScreen') && document.getElementById('controlsScreen').style.display !== 'none';
    console.log(`DEBUG: handleSpaceForControls - Key='${event.key}', Visible=${controlsVisible}`);
    if (controlsVisible && (event.key === ' ' || event.code === 'Space')) {
        console.log("DEBUG: Spacebar detected on controls screen!");
        event.preventDefault();
        document.getElementById('controlsScreen').style.display = 'none'; // Hide controls screen
        document.getElementById('info').style.display = 'block'; // Show score/lives info
        
        // Initialize game if not already done (important!)
        if (!gameInitialized) {
            console.log("DEBUG: Calling init() from handleSpaceForControls.");
            init(); 
            if (!renderer) {
                console.error("DEBUG: handleSpaceForControls - init() failed!");
                alert("Critical Error: Graphics init failed. Check console.");
                return;
            }
            console.log("DEBUG: handleSpaceForControls - init() succeeded check.");
        } else {
            console.log("DEBUG: Game already initialized (handleSpaceForControls).");
        }

        // Remove this specific listener
        window.removeEventListener('keydown', handleSpaceForControls);
        console.log("DEBUG: handleSpaceForControls listener removed.");

        // Start the actual game countdown
        console.log(">>> DEBUG: Calling startCountdown() NOW from handleSpaceForControls. <<<");
        startCountdown(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded...");

    // Cache DOM elements
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const gameOverElement = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const countdownElement = document.getElementById('countdown');
    const splashScreenElement = document.getElementById('splashScreen');
    const controlsScreenElement = document.getElementById('controlsScreen');
    const infoElement = document.getElementById('info');
    const webglErrorElement = document.getElementById('webgl-error');

    // Initial setup: Show the image splash screen
    showSplashScreen(); // This function now just displays #splashScreen

    // showSplashScreen attaches the initial Spacebar listener
    console.log("DEBUG: Splash screen displayed and listener attached by showSplashScreen().");

    // Restore global listeners
    window.addEventListener('keydown', handleKeyDown); // Handles game controls
    window.addEventListener('keyup', handleKeyUp); 
    window.addEventListener('resize', onWindowResize);

}); // <-- Make sure this closes the DOMContentLoaded listener
