import * as utils from "./utils.js";
import * as inputs from "./eventListeners.js";
import * as movement from "./movement.js";
import * as animation from "./animation.js";
import * as screen from "./screen.js";
import {initScreenElements} from "./screen.js";

export const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
export const engine = new BABYLON.Engine(canvas, true, {
	deterministicLockstep: true,lockstepMaxSteps: 4,
	/* For testing shaders, enable: preserveDrawingBuffer: true,stencil: true,disableWebGL2Support: false*/});// Init 3D engine
export const scene = new BABYLON.Scene(engine);// This creates a basic Babylon Scene object (non-mesh)

export let game = {
	time: 0,
	lastFrameTime: 0,
	frameRateLimit: 60,
	colliders: [],
	shadowGenerator: [],// TODO: Use this for each light source's `shadowGenerator`
	animations: [],
	paused: false,
	currentFPS: 0,
	curMenu: "",
	prevMenu: "",
	menus: ["ingame","pause","main","settings"],
};
export const gameSettings = {
	defaultMoveSpeed: 1,
	defaultMoveAccelerate: 0.05, // How quickly player reaches max speed, 0.2 = 5 frames later
	defaultSprintSpeed: 3,
	defaultJumpHeight: 3,
	defaultMinJumpHeight: 0.5,
	defaultMaxVelocity: 10,
	defaultFriction: 0.5, //1 being instant friction, 0 being zero friction
	defaultIdleAnimation: ["cat_idleStandA"],
	defaultAnimBlendValue: 0.15, // Set to zero in order to disable animation blending & weights
	defaultCameraDistance: 3,
	defaultPlayerMass: 2,
	defaultRotationSpeed: 0.025,
	defaultSpawnPoint: new BABYLON.Vector3(0,8,0),
	defaultGravity: new BABYLON.Vector3(0, -9, 0), // Set gravity to value that `feels` right rather than real world values
	defaultMenu: "main",
	controls: {
		forward: "KeyW",left: "KeyA",back: "KeyS",right: "KeyD",
		jump: "Space",sprint: "ShiftLeft",
		developerMenu: "Tab",
	},
	askBeforeClosing: false,
	debugMode: false,
}
export let player = {
	mesh: null, //initialized below
	body: null, //initialized below
	movement: {
		onGround: false,
		canMove: true,
		canJump: false,
		isMoving: false,
		jumping: false,
		readyJump: false,
		sprinting: false,
		forward: false,
		back: false,
		left: false,
		right: false,
		isAfk: false,
	},
	curMovementSpeed: gameSettings.defaultMoveSpeed,
	prevMovementSpeed: 0,
	sprintSpeed: gameSettings.defaultSprintSpeed,
	maxVelocity: gameSettings.defaultMaxVelocity,
	speed: 0,
	jumpHeight: gameSettings.defaultJumpHeight,
	movementDirection: BABYLON.Vector3.Zero(),
	curAnimation: gameSettings.defaultIdleAnimation,
	lastAnimation: null,
	isAnimTransitioning: false,
	lastMoveTime: 0,
	camera: new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2, // Alpha (horizontal rotation)
		Math.PI / 3, // Beta (vertical rotation)
		gameSettings.defaultCameraDistance, // Radius (distance from the target)
		undefined, // Target (initialized later)
		scene
	),
};

/**
 * @desc Updates the `player.mesh` rotation & position based on `player.body` rotation/position values
 * @todo Possibly move createScene function code into utils.js or a new `sceneHandler.js` file
 */
const createScene = async () => {
	// PHYSICS AND GRAVITY
	/* See: https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations/#deterministic-lockstep */
	let physEngine = new BABYLON.CannonJSPlugin(false);
	scene.enablePhysics(gameSettings.defaultGravity, physEngine); // Using Cannon.js for physics
	physEngine.setTimeStep(1 / 60);
	engine.renderEvenInBackground = false;

	// CAMERA
	player.camera.attachControl(canvas, true); // Attach camera controls to the canvas
	player.camera.wheelPrecision = 150;
	player.camera.lowerRadiusLimit = 1;//how close can the camera come to player
	player.camera.upperRadiusLimit = 10;//how far can the camera go from the player
	player.camera.checkCollisions = true;//moves camera closer if being obscured by geometry

	// LIGHTING
	let light = new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(3, 20, 10), scene);
	light.intensity = 0.8;
	let light2 = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(10, 20, 10), scene);
	light2.intensity = 1;

	// SHADOWS (Not working currently)
	/* // (See for more info: doc.babylonjs.com/features/featuresDeepDive/lights/shadows )
	game.shadowGenerator = new BABYLON.ShadowGenerator(1024*4, light2);
	//game.shadowGenerator.usePoissonSampling = true;
	//game.shadowGenerator.useExponentialShadowMap = true;
	game.shadowGenerator.useBlurExponentialShadowMap = true;
	game.shadowGenerator.blurScale = 1;//default 2
	game.shadowGenerator.blurBoxOffset = 1;//default 1, -1 to 1 */

	// LOAD WORLD MESHES & PHYSICSIMPOSTORS
	// Create default ground object
	utils.generateBox("ground", new BABYLON.Vector3(50,5,50), "#44aa33");

	// Spawn 100 random platforms with zero mass (static props)
	utils.generateRandomPlatforms(50, 0);// Set mass above zero to enable physics
	utils.generateRandomPlatforms(50, 10);// Set mass above zero to enable physics

	// Load player mesh into player.mesh & create physicsImpostor for player.body
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_default.glb", scene, undefined, undefined).then((result) => {
		player.mesh = result.meshes[0];// Initialize player.mesh with loaded mesh
		player.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
		player.mesh.skeleton = scene.getSkeletonByName("Player");// Init & store skeleton object
		player.mesh.skeleton.enableBlending(1);
		player.camera.setTarget(player.mesh);// Set camera target to player mesh after being loaded
		result.meshes[1].name = result.meshes[1].id = "playerMesh"; // Manually set mesh name & id to playerMesh
	});
	// TODO: adjust bounding box height for dif animations? aka jumping, crouch, etc
	player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175, height: 0.4, depth: 0.6},scene);
	player.body.physicsImpostor = new BABYLON.PhysicsImpostor(
		player.body,
		BABYLON.PhysicsImpostor.BoxImpostor, // Choose the appropriate shape
		{ mass: gameSettings.defaultPlayerMass, friction: 0, restitution: 0 },      // Adjust mass and physics properties
		scene
	);
	player.body.physicsImpostor.angularDamping = 0;// Zero damping for instant turning
	player.body.isVisible = gameSettings.debugMode; // Initialize player.body visibility based on initial `debugMode` status
	player.body.position = gameSettings.defaultSpawnPoint;

	// REGISTER INPUT, WINDOW, & ANIMATION HANDLERS
	animation.initAnimations();
	inputs.initWindowFunctions();
	inputs.initKeyboardListeners();
	screen.initScreenElements();

	return scene;
};

/**
 * @desc Runs the scene functions AFTER `createScene()` is finished
 */
createScene().then((scene) => {
	// BEFORE scene renders frame (maxes out at monitor refresh rate)
	scene.onBeforeRenderObservable.add(() => {
		game.time = performance.now();
		const deltaTime = game.time - game.lastFrameTime;
		if (deltaTime > game.frameRateLimit) {
			game.lastFrameTime = game.time - (deltaTime % game.frameRateLimit);
			// PUT CODE HERE TO BE EXECUTED @ 60FPS
			movement.handleMovement();
			animation.handleAnimations();
			screen.updateMenus();
		}
		movement.handleRotation();
		movement.syncMeshAndBody();
	});

	// ON FRAME RENDER (avoid putting code here as much as possible)
	engine.runRenderLoop(() => {
		scene.render();
	});

	// BEFORE PHYSICS CALCULATION for player body physicsImpostor
	/*player.body.physicsImpostor.registerBeforePhysicsStep((impostor) => {
		// Bugged, only detects "playerBody" physicsImpostor (...itself?)
		console.log("About to collide with: ", impostor.object.name);
	});*/

	// player body ON PHYSICS COLLIDE with other physicsImpostors
	player.body.physicsImpostor.registerOnPhysicsCollide(scene.meshes.filter(mesh => player.body || scene.getMeshByName("playerMesh")).map(mesh => mesh.physicsImpostor), (collider, collidedAgainst) => {
		if(gameSettings.debugMode)console.log("COLLISION! 💥",collider, collidedAgainst);
	});
});
