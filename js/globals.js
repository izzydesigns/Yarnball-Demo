// NOTE: This file serves only as a way to share main variables used across most other files
// Avoid circular dependencies by keeping the imports in this file completely empty.
// Any file you import here for whatever reason, cannot have imports from this file as a result.

/**
 * @desc This global variable contains the window's `#renderCanvas` canvas element & data
 * */
export const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
/**
 * @desc This global variable contains the scene's `BABYLON.Engine` object
 * @desc Initialized immediately after the `canvas` variable has been fetched
 * @type {BABYLON.Engine || BABYLON.WebGPUEngine}
 * */
export let engine;
/**
 * @desc Setter for the `engine` object
 * */
export function setEngine(desiredEngine){engine = desiredEngine;return engine;}
/**
 * @desc This global variable contains the global scene variable used in all other files
 * @desc This gets initialized right away as well, creating the default scene immediately
 * @type BABYLON.Scene
 * */
export let scene;
/**
 * @desc Setter for the `scene` object
 * */
export function setScene(desiredScene){scene = desiredScene;return scene;}
/**
 * @desc This global variable contains all of the relevant data for the game itself
 * @desc This contains various important vars for things like the `game.time`, `game.paused`, and `game.currentFPS`, for example
 * */
export const game = {
    time: performance.now(), // Returns time since window was loaded (in ms)
    lastFrameTime: 0,
    frameRateLimit: 1000/60, // Determines how many milliseconds have passed since `lastFrameTime` was updated
    paused: false,
    currentFPS: 0,
    curMenu: "",
    prevMenu: "",
    menus: ["ingame","pause","main","settings"],
    physicsImpostors: [],
    animations: [],
    lights: [],
    shadowGenerators: [],
};
/**
 * @desc This global variable contains all of the "default values" for various game settings
 * @desc Used to keep all initialization values in one place, and also contains the `controls` object key which declares all of the game's default keybinds
 * */
export const gameSettings = {
    defaultMoveSpeed: 1,
    defaultMoveAccelerate: 0.04, // How quickly player reaches max horizontalSpeed, +0.2 per frame = 5 frames long
    defaultMoveDelay: 0, // Pause duration before movement is allowed TODO: Set this to the specified turn anim's duration (if player.body is turning/rotating)
    defaultWalkSpeed: 0.5,
    defaultSprintSpeed: 3,
    defaultJumpHeight: 2.5,
    defaultJumpDelay: 1, // Seconds until canJump is set to true again after jumping
    defaultMinJumpHeight: 1,
    defaultMaxVelocity: 10, // Must be at least twice the sprint speed(?)
    defaultFriction: 0.115, //1 being instant friction, 0 being zero friction
    defaultIdleAnimation: ["cat_idleStandA"],
    defaultTimeBeforeSleepIdle: 15000, // After 15 seconds, sleeping idle animation will play
    defaultAnimBlendValue: 0.1, // Set to zero in order to disable animation blending & weights
    defaultCameraDistance: 1,
    defaultCamOffset: new BABYLON.Vector3(0,0.165,0.125),
    defaultPlayerMass: 5,
    defaultRotationSpeed: 0.025,
    defaultMaxSlopeAngle: 35,
    defaultSlopeAngle: 20,
    defaultPlayerScale: 1,
    defaultSpawnPoint: new BABYLON.Vector3(0,2,0), // Used if no "Spawnpoint" data point found in map file
    defaultGravity: new BABYLON.Vector3(0, -9, 0),
    defaultMenu: "ingame",
    jumpDetectionBuffer: 0.05, // TODO: Scale this by `defaultPlayerScale` also
    controls: {
        forward: "KeyW",left: "KeyA",back: "KeyS",right: "KeyD",
        jump: "Space",sprint: "ShiftLeft",walk: "AltLeft",
        developerMenu: "NumpadMultiply",
    },
    askBeforeClosing: false,
    debugMode: false,
};
/**
 * @desc This global variable contains all of the relevant data for the player's object
 * @desc This also contains the `player.body` and `player.mesh` variables, which are used in various places
 * */
export const player = {
    mesh: null, //initialized below
    body: null, //initialized below
    movement: {
        isSliding: false,
        canMove: true,
        canJump: false,
        canSprint: true,
        isMoving: false,
        jumping: false,
        readyJump: false,
        sprinting: false,
        walking: false,
        forward: false,
        back: false,
        left: false,
        right: false,
        isAfk: false,
    },
    onGround: false,
    isSleeping: false,
    tiltDegrees: null,
    curMovementSpeed: gameSettings.defaultMoveSpeed,
    sprintSpeed: gameSettings.defaultSprintSpeed,
    maxVelocity: gameSettings.defaultMaxVelocity,
    horizontalSpeed: 0,
    speed: 0,
    jumpHeight: gameSettings.defaultJumpHeight,
    movementDirection: BABYLON.Vector3.Zero(),
    curAnimation: gameSettings.defaultIdleAnimation,
    lastAnimation: null,
    isAnimTransitioning: false,
    lastMoveTime: 0,
    lastJumpTime: 0,
    camera: undefined,
    scale: gameSettings.defaultPlayerScale, // TODO: Adjust/scale final movement speed based on the player.scale value?
};
