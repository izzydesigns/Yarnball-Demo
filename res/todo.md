CURRENT TASKS:
===

- Create basic starting level with simple physics objects
  - [ ] Look into creating multiple "scenes" at this point, for different levels and such? (or create sceneLoader function)
  - [ ] Physics objects such as cubes, spheres, and cylinders first, then custom meshes with boundingboxes
  - [ ] Movement-enabled objects as well, such as a spinning feris wheel or playground spinner, etc...
- Enable shadows from all valid light sources in the scene
  - [ ] Create shadowGenerators for all lights loaded from a mesh (the level mesh specifically)
  - [ ] Ensure doing the above doesn't cause too much extra performance overhead (otherwise specify in the level data which lights get shadows)
- Further improve movement mechanics
  - [ ] Fix player rotation clipping through objects (see below issue as well)
    - Possibly prevent player rotation if it causes a collision event, so `registerBeforePhysicsStep` it?
  - [ ] Fix player being an (unstoppable force) so to speak, when colliding with other objects
    - Also use `registerBeforePhysicsStep` probably...
  - [ ] Add sneaking (alter player's hitbox height, check if player can uncrouch safely or not also) and animate the height change
  - [ ] Tweak overall default settings until things "feel" right ingame.
    - See: main.js - `registerBeforePhysicsStep` (currently commented out due to being bugged)
- Further improve animation system
  - [ ] Add turn animations & set `player.movement.canMove = false` when turning
  - [ ] Add ability to force play any desired animation (to allow testing of various idle anims)
  - [ ] Refine jumping/falling animation handling by playing first half of jump animation while moving up, second half while moving down (animation.js - 136)
- Add "swat" mechanic via tying small physicsImpostor to bone in player arm, then playing the animation.
  - [ ] Set collision properties for player's arm to solid ONLY when swatting action is taking place
  - [ ] Ensure the arm physicsImpostor is in an entirely separate collision group from player body
- Implement a simple sound system
  - [ ] Add ambient sounds/main menu music
  - [ ] Add some kind of footstep sound
  - [ ] Add sound when player jumps
  - [ ] Add sound when player collides with object? (maybe a little meow)
  - [ ] Add purring sound while certain idle animations are playing!
- Implement save/export game state feature
  - [ ] Add autosaving by default (users shouldn't have to think about saving or exporting in general)
  - [ ] When autosaving, display some kind of visual indicator that an autosave just happened
  - [ ] Mostly, export the data within `gameSettings` since the default variables in there can be modified, and possibly creating a sub-array named `settings`
  - [ ] If data becomes too large to store in browser storage, export data to raw .txt file instead
  - [ ] Prompt users to save their game before exiting (if last autosave is not equal to current game state)


KNOWN BUGS:
===

[(See github issues)](https://github.com/izzydesigns/Yarnball-Demo/issues)

NOTES/MISC RESOURCES:
===

- Camera animation sequence (cutscene example)

  https://doc.babylonjs.com/features/featuresDeepDive/animation/sequenceAnimations/#cartoon

  https://playground.babylonjs.com/#2L26P1#8

- Toon shader example

  https://playground.babylonjs.com/#SH5DVI#1

  ALSO See: Highlight layer `isStroke` boolean

  https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer#options

- Store game data in browser via browser "Storage" api

  https://developer.mozilla.org/en-US/docs/Web/API/Storage

*"Hey you, yea you, you're doing a great job! Keep up the great work ^_^" - Izzy*