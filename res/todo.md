TODO LIST:
===
---

- Enable shadows from all valid light sources in the scene
	- [ ]  Debug issues with shadowGenerator seemingly not working (entire scene is pitch black without the HemisphericLight on)
- Enable shadows from all valid light sources in the scene
	- [ ]  Debug issues with shadowGenerator seemingly not working (entire scene is pitch black without the HemisphericLight on)
- Implement basic modular UI screen overlay system
	- [ ]  Add a basic main menu scene with simple UI
	- [ ]  Add in-game HUD overlay (for debugging purposes initially)
- Create basic starting level with simple physics objects
	- [ ]  Look into creating multiple "scenes" at this point, for different levels and such? (or create sceneLoader function)
	- [ ]  Physics objects such as cubes, spheres, and cylinders first, then custom meshes with boundingboxes
- Add "swat" mechanic via tying small physicsImpostor to bone in player arm, then playing the animation.
	- [ ]  Set collision properties for player's arm to solid ONLY when swatting action is taking place
	- [ ]  Ensure the arm physicsImpostor is in an entirely separate collision group from player body
- Implement a simple sound system
	- [ ]  Add some kind of footstep sound
	- [ ]  Add sound when player jumps
	- [ ]  Add sound when player collides with object? (maybe a little meow)
- Further improve movement system
	- [ ]  Add jumping in-place (currently ties horizontal velo magnitude to Y axis, so it should be an easy fix)
	- [ ]  Add sneaking (alter player's hitbox height, check if player can uncrouch safely or not also)
	- [ ]  Possibly change jump to hold space = generate line previewing trajectory, and let go to jump?
	- [ ]  Disable player.movement.canMove when turn animations are happening
    - [ ] Re-add movement delay (currently none) that is length of turn animation
    - [ ] Re-enable player movement upon animation completion (don't loop anim either)
    - [ ] Fix jump ready bug: have 0 speed -> tap spacebar -> wait -> move = jumping ???

COMPLETED:
===
---

- Create robust animation system **(COMPLETED ON 1/17/25)**
	- [x]  Handle simple animation states (like walking, idling, sprinting, jumping, etc)
	- [x]  Enable animation blending (using animation weights?)
	- [x]  Create basic state system for animations and determining animation completion
- Create basic movement mechanics system **(COMPLETED ON 12/25/24)**
	- [x]  Define what kind of movement mechanics I want, fluid movement? precise movement?
	- [x]  Create simple input handler to detect when movement keys are being pressed
	- [x]  Apply movement forces when movement is detected (and player.canMove = true, onGround = true, etc)
	- [x]  Write function to determine when player is onGround and set player.onGround accordingly
	- [x]  Add basic jumping
- Continue working on movement system, debug glitchy jump & rotation bugs **(COMPLETED ON 12/23/24)**
	- [x]  Fix sudden acceleration when moving in any direction, make it gradual (lerp it?)
	- [x]  Fix jump not preserving directional speed while other keys are held, maybe due to tiny collision occuring at the frame the jump happens?
	- [x]  Explore buggy rotation due to collisions with player.body affecting rotation & not overriding
	- [x]  Determine what kind of jump mechanic we want (possibly hold space to generate jump line previewing jump trajectory?)

NOTES/MISC RESOURCES:
===
---

*"Hey you, yea you, you're doing a great job! Keep up the great work ^_^" - Izzy*

- Camera animation sequence (cutscene example)

  https://doc.babylonjs.com/features/featuresDeepDive/animation/sequenceAnimations/#cartoon

  https://playground.babylonjs.com/#2L26P1#8

- Animation easing functions

  https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations/#easing-functions

  https://playground.babylonjs.com/#8ZNVGR

- Toon shader exa

  https://playground.babylonjs.com/#SH5DVI#1

  ALSO See: Highlight layer `isStroke` boolean

  https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer#options