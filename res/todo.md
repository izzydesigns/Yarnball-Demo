CURRENT TASKS:
===

- Further improve movement mechanics
  - [ ]  Fix player rotation causing clipping through objects (see below issue as well)
  - [ ]  Fix player being an (unstoppable force) so to speak, when colliding with other objects
    - See: `KNOWN BUGS #2` as fixing this will likely fix that as well
  - [ ]  Add sneaking (alter player's hitbox height, check if player can uncrouch safely or not also) and animate the height change
  - [ ]  Tweak overall default settings until things "feel" right ingame. (Make a real test level finally?)
    - See: main.js - `registerBeforePhysicsStep` (currently commented out due to being bugged)
- Further improve animation system
  - [ ]  Add turn animations & set player.movement.canMove = false when turning
  - [ ]  Refine falling animation by playing first half of jump animation while moving up, second half while moving down (animation.js - 136)
  - [ ]  Refine jumping animation (or add visual indicators) prevent jumpReady anim while moving
- Create basic starting level with simple physics objects
  - [ ]  Look into creating multiple "scenes" at this point, for different levels and such? (or create sceneLoader function)
  - [ ]  Physics objects such as cubes, spheres, and cylinders first, then custom meshes with boundingboxes
- Add "swat" mechanic via tying small physicsImpostor to bone in player arm, then playing the animation.
  - [ ]  Set collision properties for player's arm to solid ONLY when swatting action is taking place
  - [ ]  Ensure the arm physicsImpostor is in an entirely separate collision group from player body
- Implement a simple sound system
  - [ ] Add some kind of footstep sound
  - [ ] Add sound when player jumps
  - [ ] Add sound when player collides with object? (maybe a little meow)
- Implement save/export game state feature
  - [ ] Add autosaving by default (users shouldn't have to think about saving or exporting in general)
  - [ ] When autosaving, display some kind of visual indicator that an autosave just happened
  - [ ] If data becomes too large to store in browser storage, export data to raw .txt file instead
  - [ ] Prompt users to save their game before exiting (if last autosave is not equal to current game state)

COMPLETED TASKS:
===

- Further improve movement mechanics
  - [x]  Add walking (bind to left control by default)
  - [x]  Add cooldown between jumping to prevent bunnyhopping
  - [x]  Fix player being on slopes (player rotation currently locked to Y axis)
  - [x]  Fix jump bug (hold space, tap a direction and immediately let go, the player keeps moving???)
  - [x]  Add jumping in-place (currently ties horizontal velo magnitude to Y axis, so it should be an easy fix)
  - [x]  Fix player.body physicsImpostor bugginess when colliding with objects at an angle
  - [x]  Fix jump ready bug: have 0 speed -> tap spacebar -> wait -> move = jumping ???
  - [x]  Fix `onGround` & `isSliding` checks
  - [x]  Fix isSliding check in movement.js - 79 & main.js - 233
  - [x]  Re-add movement delay (currently none)
- Enable shadows from all valid light sources in the scene **(COMPLETED ON 1/27/25)**
  - [x]  Debug issues with shadowGenerators seemingly not working (entire scene is pitch black without the HemisphericLight on)
- Implement basic modular UI screen overlay system **(COMPLETED ON 1/17/25)**
  - [x]  Add a basic main menu scene with simple UI
  - [x]  Add in-game HUD overlay (for debugging purposes initially)
- Create robust animation system **(COMPLETED ON 1/17/25)**
  - [x] Handle simple animation states (like walking, idling, sprinting, jumping, etc)
  - [x] Enable animation blending (using animation weights?)
  - [x] Create basic state system for animations and determining animation completion
- Create basic movement mechanics system **(COMPLETED ON 12/25/24)**
  - [x] Define what kind of movement mechanics I want, fluid movement? precise movement?
  - [x] Create simple input handler to detect when movement keys are being pressed
  - [x] Apply movement forces when movement is detected (and player.canMove = true, onGround = true, etc)
  - [x] Write function to determine when player is onGround and set player.onGround accordingly
  - [x] Add basic jumping
- Continue working on movement system, debug glitchy jump & rotation bugs **(COMPLETED ON 12/23/24)**
  - [x] Fix sudden acceleration when moving in any direction, make it gradual (lerp it?)
  - [x] Fix jump not preserving directional speed while other keys are held, maybe due to tiny collision occuring at the frame the jump happens?
  - [x] Explore buggy rotation due to collisions with player.body affecting rotation & not overriding
  - [x] Determine what kind of jump mechanic we want (possibly hold space to generate jump line previewing jump trajectory?)

KNOWN BUGS:
===

1. Jumping causes speed to spike, go down, then spike again while moving in the air
   - FIX #1: Change how the custom friction method works & check if we're in the air due to a player jump or because we're falling
   - FIX #2: Determine proper place for jump calculation code to go in the chain of `finalVelo` assignments
2. Standing on slanted surfaces greater than the allowed slope limit causes strange speed boosts
   - FIX: Change final applied finalVelocity value to be relative to the player's up direction (or get player down.scale(-1))
3. Animation for jumping is bugged (plays as expected, but if in the air too long the animation ends by landing on a surface mid-air)
   - FIX: Add system to specify an animation pause at the apex of the jump, and resume when falling, ending when ground is finally touched again
4. The speedometer progress bar on the HUD has a width easing effect on it that I can't seem to change to `linear` despite trying for a bit
   - FIX: Persistence/chatgpt? :)
5. Sprinting up slopes should not work
6. `player.body` (and thus physicsImpostor) have zero friction, instead using custom friction in movement.js... resulting in various possibly unintended behaviors

NOTES/MISC RESOURCES:
===

*"Hey you, yea you, you're doing a great job! Keep up the great work ^_^" - Izzy*

- Camera animation sequence (cutscene example)

  https://doc.babylonjs.com/features/featuresDeepDive/animation/sequenceAnimations/#cartoon

  https://playground.babylonjs.com/#2L26P1#8

- Animation easing functions

  https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations/#easing-functions

  https://playground.babylonjs.com/#8ZNVGR

- Toon shader example

  https://playground.babylonjs.com/#SH5DVI#1

  ALSO See: Highlight layer `isStroke` boolean

  https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer#options

- Store game state & player data in browser

  https://developer.mozilla.org/en-US/docs/Web/API/Storage