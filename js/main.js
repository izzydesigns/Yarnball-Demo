import * as utils from "./utils.js";
import * as inputs from "./eventListeners.js";
import * as movement from "./movement.js";
import * as animation from "./animation.js";
import * as screen from "./screen.js";
import {vec3} from "./utils.js";

export const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
export const engine = new BABYLON.Engine(canvas, true, {
	deterministicLockstep: true,lockstepMaxSteps: 4,
	/* For testing shaders, enable: preserveDrawingBuffer: true,stencil: true,disableWebGL2Support: false*/}); // Init 3D engine
export const scene = new BABYLON.Scene(engine); // This creates a basic Babylon Scene object (non-mesh)

export let game = {
	time: performance.now(), // Returns time since window was loaded (in ms)
	lastFrameTime: 0,
	frameRateLimit: 1000/60, // Determines how many milliseconds have passed since `lastFrameTime` was updated
	paused: false,
	currentFPS: 0,
	curMenu: "",
	prevMenu: "",
	menus: ["ingame","pause","main","settings"],
	physicsImpostors: [],
	excludedFromCollisions: [],
	animations: [],
	lights: [],
	shadowGenerators: [],
};
export const gameSettings = {
	defaultMoveSpeed: 1,
	defaultMoveAccelerate: 0.04, // How quickly player reaches max absoluteSpeed, 0.2 = 5 frames later
	defaultMoveDelay: 0.5, // (set to negative value) How many seconds(?) to wait before player movement begins
	defaultSprintSpeed: 3,
	defaultJumpHeight: 2.5,
	defaultJumpDelay: 1, // Seconds until canJump is set to true again after jumping
	defaultMinJumpHeight: 1,
	defaultMaxVelocity: 8,
	defaultFriction: 0.115, //1 being instant friction, 0 being zero friction
	defaultIdleAnimation: ["cat_idleStandA"],
	defaultAnimBlendValue: 0.1, // Set to zero in order to disable animation blending & weights
	defaultCameraDistance: 3,
	defaultCamOffset: vec3(0,0.165,0),//0.125),
	defaultPlayerMass: 5,
	defaultRotationSpeed: 0.025,
	defaultMaxSlopeAngle: 40,
	defaultSteepAngle: 20,
	defaultSpawnPoint: vec3(0,8,0),
	defaultGravity: vec3(0, -9, 0), // Set gravity to value that `feels` right rather than real world values
	defaultMenu: "main",
	jumpDetectionBuffer: 0.2, // If jump spamming = multi jump, change this to zero?
	controls: {
		forward: "KeyW",left: "KeyA",back: "KeyS",right: "KeyD",
		jump: "Space",sprint: "ShiftLeft",
		developerMenu: "NumpadMultiply",
	},
	askBeforeClosing: false,
	debugMode: false,
};
export let player = {
	mesh: null, //initialized below
	body: null, //initialized below
	onGround: false,
	movement: {
		isSliding: false,
		canMove: true,
		canJump: false,
		canSprint: true,
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
	curLookDirection: vec3(),
	curDownVector: vec3(),
	tiltDegrees: null,
	curMovementSpeed: gameSettings.defaultMoveSpeed,
	prevSpeed: 0,
	sprintSpeed: gameSettings.defaultSprintSpeed,
	maxVelocity: gameSettings.defaultMaxVelocity,
	absoluteSpeed: 0,
	speed: 0,
	jumpHeight: gameSettings.defaultJumpHeight,
	movementDirection: BABYLON.Vector3.Zero(),
	curAnimation: gameSettings.defaultIdleAnimation,
	lastAnimation: null,
	isAnimTransitioning: false,
	lastMoveTime: 0,
	lastJumpTime: 0,
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
	player.camera.lowerRadiusLimit = 0.25; //how close can the camera come to player
	player.camera.upperRadiusLimit = 10; //how far can the camera go from the player
	player.camera.minZ = 0.001;
	//player.camera.checkCollisions = true; //moves camera closer if being obscured by geometry

	// LIGHTING
	// Lights
	const ambientLight = new BABYLON.HemisphericLight("ambientLight", vec3(-1, -1, -1), scene);
	ambientLight.position = vec3(0,50,0);
	ambientLight.intensity = 0.2; // Soft ambient lighting
	const sunLight = new BABYLON.DirectionalLight("sunLight", vec3(-1, -2, -1), scene);
	sunLight.position = vec3(50, 100, 50); // Position of the light source
	sunLight.intensity = 1.5; // Brightness of the sunlight
	sunLight.diffuse = new BABYLON.Color3(1, 1, 0.95);
	sunLight.specular = new BABYLON.Color3(1, 1, 0.8); // Light reflections
	game.shadowGenerators.push(utils.createShadowGenerator(sunLight,undefined,undefined,undefined,undefined,true));
	// ( See: doc.babylonjs.com/features/featuresDeepDive/lights/shadows )

	// LOAD WORLD MESHES & PHYSICSIMPOSTORS
	// Create ground
	utils.generateBox("ground", vec3(50,5,50), undefined, "#448844");
	// Spawn 100 random platforms, half of which have 5 mass while the rest are static.
	utils.generateRandomBoxes(50, [0,5,0], [25,5,25], [[0.1,5], [0.1,0.1], [0.1,5]]);
	utils.generateRandomBoxes(50, [0,5,0], [25,5,25], [[0.1,5], [0.1,0.1], [0.1,5]],5);
	// Load player mesh into player.mesh & create physicsImpostor for player.body
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_new.glb", scene, undefined, undefined).then((result) => {
		result.meshes[1].name = result.meshes[1].id = "playerMesh"; // Manually set mesh name & id to playerMesh
		player.mesh = result.meshes[0]; // Initialize player.mesh with loaded mesh
		player.mesh.scaling = vec3(2, 2, 2);
		player.mesh.skeleton = scene.getSkeletonByName("Player"); // Init & store skeleton object
		player.mesh.skeleton.enableBlending(1);
		const cameraOffset = player.mesh.position.addInPlace(gameSettings.defaultCamOffset);
		const offsetMesh = BABYLON.MeshBuilder.CreateBox("camOffset",{size:0.01},scene);
		offsetMesh.position = cameraOffset;
		offsetMesh.parent = player.mesh;
		offsetMesh.checkCollisions = false;
		offsetMesh.isVisible = false;
		player.camera.setTarget(offsetMesh); // Set camera target to player mesh after being loaded

		// Add player model to all shadowGenerators in game.shadowGenerators[]
		utils.addMeshToShadowGens(result.meshes[0]);

		// Create simple box for movement and collision handling
		// TODO: adjust bounding box height for dif animations? aka jumping, crouch, etc
		player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175, height: 0.4, depth: 0.6},scene);
		player.body.physicsImpostor = new BABYLON.PhysicsImpostor(
			player.body,
			BABYLON.PhysicsImpostor.BoxImpostor, // Choose the appropriate shape
			{ mass: gameSettings.defaultPlayerMass, friction: 0, restitution: 0 },      // Adjust mass and physics properties
			scene
		);
		player.body.physicsImpostor.angularDamping = 0; // Zero damping for instant turning
		player.body.isVisible = gameSettings.debugMode; // Initialize player.body visibility based on initial `debugMode` status
		player.body.position = gameSettings.defaultSpawnPoint;
		player.body.rotationQuaternion = new BABYLON.Quaternion(0,0,0,1);
	});

	// REGISTER INPUT, WINDOW, ANIMATION & DEBUG HANDLERS
	animation.initAnimations();
	inputs.initWindowFunctions();
	inputs.initKeyboardListeners();
	screen.initScreenElements();
	utils.showAxisHelper(10, vec3(10,2.5, 10));

	// Update shadowGenerators with previously created/initialized meshes
	scene.meshes.forEach(mesh => {
		if (mesh.name !== "excludedMeshName"){
			for(let i in game.shadowGenerators){
				//console.log("shadowGenerator["+i+"]",game.shadowGenerators[i]);
				game.shadowGenerators[i].addShadowCaster(mesh);
			}
		}
	});
	game.excludedFromCollisions.push(scene.getMeshByName("playerBody"),scene.getMeshByName("playerMesh"),scene.getMeshByName("camOffset"));
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
			animation.handleAnimations();
			movement.handleMovement();
			screen.updateMenus();
		}
		movement.handleRotationAndPosition();
	});

	// Called less often than scene.onBeforeRender, still avoid putting unnecessary code here...
	engine.runRenderLoop(() => {scene.render();});

	// BEFORE PHYSICS CALCULATION for player body physicsImpostor
	/*player.body.physicsImpostor.registerBeforePhysicsStep((impostor) => {
		// Bugged, only detects "playerBody" physicsImpostor (...itself?)
		console.log("About to collide with: ", impostor.object.name);
	});*/

	// player body ON PHYSICS COLLIDE with other physicsImpostors
	player.body.physicsImpostor.registerOnPhysicsCollide(scene.meshes.filter(() => scene.getMeshByName("playerBody") || scene.getMeshByName("playerMesh")).map(mesh => mesh.physicsImpostor), (collider, collidedAgainst) => {
		// Note: This code also caused HUGE dips in FPS
		if(gameSettings.debugMode)console.log("COLLISION! 💥", collider, collidedAgainst);
		//let colliderMesh = scene.getMeshByName("playerMesh");
		if(gameSettings.debugMode)console.log(collider.object.name, collidedAgainst.object.name);
		// Check if we are colliding with a surface below us or not
		const collidedMesh = collidedAgainst.object; if (!collidedMesh) return;
		//console.log(collidedAgainst);
		// Calculate the surface normal of the collided mesh
		const surfaceNormal = utils.getSurfaceNormal(collidedMesh, 3, false); if (!surfaceNormal) return;
		let isOnSlant = player.tiltDegrees >= gameSettings.defaultMaxSlopeAngle;
		if(gameSettings.debugMode)console.log("isSliding?", isOnSlant, "angleDeg:", player.tiltDegrees, "maxAngle:", gameSettings.defaultMaxSlopeAngle);
		if(isOnSlant) {
			player.movement.isSliding = true;
			player.onGround = false;
		}
	});
});
