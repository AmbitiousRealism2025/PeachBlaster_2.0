# Peach Blaster Game

A simple HTML/CSS/JavaScript game using the Three.js library.

## Running the Game

The primary way to run Peach Blaster is by opening the `index.html` file directly in a modern web browser that supports WebGL.

1.  Navigate to the directory where you have the game files.
2.  Double-click `index.html` or use your browser's "Open File" option to load it.

**Alternative Method (if encountering issues or for development):**

If you experience any issues with direct file access (though uncommon for this type of project) or prefer a local server environment:

1. Ensure you have Python installed.
2. Open a terminal or command prompt in this directory.
3. Run the command: `python -m http.server`
4. Open your web browser and navigate to `http://localhost:8000` (or the port specified by the command).

## Controls

- **[A]** or **[Left Arrow]**: Rotate Left
- **[D]** or **[Right Arrow]**: Rotate Right
- **[W]** or **[Up Arrow]**: Thrust Forward
- **[Space]**: Fire Blasts

Press **[Space]** to start the game from the splash screen.

# Peach Blaster

A modern interpretation of the classic Asteroids arcade game, built with Three.js.

**Version:** 2.0.22 (Variable Thruster Fix) [cite: 80]

## Description

Pilot your ship through a field of hazardous peaches! Blast the fuzzy fruit before they collide with your ship. This project aims to recreate the core Asteroids experience within a single HTML file using Three.js, replacing asteroids with peaches and incorporating modern visuals[cite: 1].

## Original Objectives [cite: 1]

- Create a modern interpretation of "Asteroids" in a single HTML file using Three.js (CDN)[cite: 1].
  _(Note: While the initial concept aimed for a single HTML file, the project is currently organized with separate JavaScript (`game.js`) and CSS (`style.css`) files for better maintainability and development clarity, all linked from `index.html`.)_
- Replace asteroids with "Peaches" of varying sizes[cite: 2].
- Initially planned to replace the enemy saucer with "Robotic Bees/Wasps" (simplified later)[cite: 2, 13].
- Implement modern graphics, sound (planned), and power-ups (simplified later)[cite: 3, 13].
- Core gameplay: Player rotation/thrust, shooting, collision detection, peach destruction (breaking into smaller pieces), scoring, lives, screen wrapping[cite: 4].
- Utilize ES6+ JavaScript features and a structured function approach (init, createPlayer, etc.)[cite: 5].

## Current State (v2.0.22)

- Runs in a single HTML file using Three.js (r128) via CDN[cite: 1].
- Displays an 80s-style splash screen; Spacebar starts a 5-second countdown[cite: 8, 22].
- Player controls a swept-wing fighter style ship[cite: 74].
- Player movement includes inertia and damping[cite: 15, 24].
- Visual thrusters vary in length based on thrust key duration[cite: 76, 81].
- Peaches (textured spheres: large, medium, small) spawn, move randomly, and break into smaller pieces when shot[cite: 64, 67, 25]. Textures use procedural canvas generation with caching[cite: 64, 66].
- Player bullets travel until off-screen[cite: 10, 26].
- Collision detection works for bullets vs. peaches and player vs. peaches[cite: 16, 26].
- Player loses a life and resets to center (with temporary invincibility and visual flashing) upon collision with a peach[cite: 27].
- Score increases when peaches are destroyed[cite: 28]. Lives are tracked[cite: 28].
- "Game Over" screen appears with the final score and a restart button[cite: 28].
- Objects wrap around the defined screen boundaries[cite: 14, 29].
- Includes a static starfield background with blinking stars (using a "blinker pool" method) and a single distant, ringed planet[cite: 37, 44, 50, 57]. Star occlusion by the planet is handled[cite: 45].
- Basic ambient and directional lighting is present[cite: 29].

## Controls

- **[A] / [Left Arrow]:** Rotate Left [cite: 23]
- **[D] / [Right Arrow]:** Rotate Right [cite: 23]
- **[W] / [Up Arrow]:** Thrust Forward [cite: 23]
- **[Spacebar]:** Fire Blasts [cite: 23]

## Development Changelog Highlights

_Note: `[cite: XX]` numbers are internal development references and can be disregarded by users/contributors._

- **Initial Setup:** Basic Three.js scene, core mechanics (ship, peaches, shooting)[cite: 6, 35].
- **Splash/Countdown:** Added start screen and countdown timer[cite: 8]. Debugged startup issues[cite: 11].
- **Simplification:** Removed initial enemy/power-up concepts to focus on core gameplay[cite: 13].
- **Controls:** Switched from initial direct movement back to classic rotate/thrust model with damping[cite: 12, 15].
- **Visuals - Background:**
  - Added static starfield (THREE.Points)[cite: 37]. Fixed persistence across restarts[cite: 39].
  - Attempted shader-based blinking, encountered issues with r128[cite: 40, 48, 49].
  - Implemented successful "blinker pool" method for blinking stars[cite: 50]. Fixed restart bug for blinking[cite: 53, 57].
  - Added single, detailed, ringed planet using `CanvasTexture` and `RingGeometry`[cite: 44, 45]. Adjusted blinking appearance[cite: 46, 61, 62].
- **Visuals - Peaches:** Implemented stable procedural `CanvasTexture` for peaches (gradient, fuzz, cleft) with caching[cite: 64, 65, 66, 67].
- **Visuals - Player:** Updated player model from simple shapes to a detailed swept-wing design with line details[cite: 70, 71, 74, 75].
- **Visuals - Thruster:** Implemented variable-length thruster effect based on key press duration, fixing bugs related to implementation[cite: 76, 77, 78, 79, 80, 81].
- **Visuals - Explosion:** Added basic particle explosion when the player ship is hit.

## Known Issues / Next Steps (from v2.0.22)

1.  **Player Explosion Effect Implemented**
    - Added particle explosion when the player ship is hit.
    - `createExplosion(position)` spawns simple sphere particles.
    - `updateExplosionParticles(dt)` updates and cleans them up.
    - The effect triggers from `handlePlayerHit` and updates each frame.
2.  **Implement Sound Effects & Music:** [cite: 86]
    - Integrate a sound library (e.g., Howler.js or Web Audio API)[cite: 87].
    - Add sounds for: Shooting, Peach Hit/Break, Player Hit/Explosion, Thrusting (loop), Game Start, Game Over[cite: 88].
    - Consider background music[cite: 88].
3.  **Visual Refinements (Lower Priority):** [cite: 89]
    - Further tweaks to ship model/lines/colors[cite: 89].
    - Adjust peach texture appearance[cite: 89].
    - Tweak thruster animation (e.g., color shift based on intensity)[cite: 90].

## Development

Run `npm run format` to apply Prettier formatting to the codebase.
