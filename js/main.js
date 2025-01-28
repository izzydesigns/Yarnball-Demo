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
	excludeFromRayResults: [],
	animations: [],
	lights: [],
	shadowGenerators: [],
};
export const gameSettings = {
	defaultMoveSpeed: 1,
	defaultMoveAccelerate: 0.04, // How quickly player reaches max horizontalSpeed, 0.2 = 5 frames later
	defaultMoveDelay: 0, // Pause duration before movement is allowed TODO: Set this to the specified turn anim's duration (if player.body is turning/rotating)
	defaultWalkSpeed: 0.5,
	defaultSprintSpeed: 3,
	defaultJumpHeight: 2.5,
	defaultJumpDelay: 1, // Seconds until canJump is set to true again after jumping
	defaultMinJumpHeight: 1,
	defaultMaxVelocity: 10, // Must be at least twice the sprint speed(?)
	defaultFriction: 0.115, //1 being instant friction, 0 being zero friction
	defaultIdleAnimation: ["cat_idleStandA"],
	defaultAnimBlendValue: 0.1, // Set to zero in order to disable animation blending & weights
	defaultCameraDistance: 3,
	defaultCamOffset: vec3(0,0.165,0.125),//0.125),
	defaultPlayerMass: 5,
	defaultRotationSpeed: 0.025,
	defaultMaxSlopeAngle: 40,
	defaultSlopeAngle: 20,
	defaultPlayerScale: 1, // Default amount to scale loaded player mesh up by (in all directions)
	defaultSpawnPoint: vec3(0,8,0),
	defaultGravity: vec3(0, -9, 0), // Set gravity to value that `feels` right rather than real world values
	defaultMenu: "main",
	jumpDetectionBuffer: 0.05, // If jump spamming = multi jump, change this to zero?
	controls: {
		forward: "KeyW",left: "KeyA",back: "KeyS",right: "KeyD",
		jump: "Space",sprint: "ShiftLeft",walk: "AltLeft",
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
		walking: false,
		forward: false,
		back: false,
		left: false,
		right: false,
		isAfk: false,
	},
	curLookDirection: vec3(),
	curDownVector: vec3(),
	tiltDegrees: null,
	colliding: false,
	curMovementSpeed: gameSettings.defaultMoveSpeed,
	prevSpeed: 0,
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
	ragdoll: undefined,
	scale: gameSettings.defaultPlayerScale, // TODO: Adjust/scale final movement speed based on the player.scale value?
};

/**
 * @desc Updates the `player.mesh` rotation & position based on `player.body` rotation/position values
 * @todo Possibly move createScene function code into utils.js or a new `sceneHandler.js` file
 */
const createScene = async () => {
	/* PHYSICS AND GRAVITY */
	// See: https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations/#deterministic-lockstep
	let physEngine = new BABYLON.CannonJSPlugin(false);
	scene.enablePhysics(gameSettings.defaultGravity, physEngine); // Using Cannon.js for physics
	physEngine.setTimeStep(1 / 60);
	engine.renderEvenInBackground = false;

	/* CAMERA */
	player.camera = new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2, // Alpha (horizontal rotation)
		Math.PI / 3, // Beta (vertical rotation)
		gameSettings.defaultCameraDistance, // Radius (distance from the target)
		undefined, // Target (initialized later)
		scene
	);
	player.camera.attachControl(canvas, true); // Attach camera controls to the canvas
	player.camera.wheelPrecision = 150;
	player.camera.lowerRadiusLimit = 0.25; //how close can the camera come to player
	player.camera.upperRadiusLimit = 10; //how far can the camera go from the player
	player.camera.minZ = 0.001;
	//player.camera.checkCollisions = true; //moves camera closer if being obscured by geometry

	/* LIGHTING & SHADOWS */
	// Create main light source (sun)
	let sunLight = utils.createDirectionalLight("sunLight", vec3(-1.5, -1.5, -1.5), vec3(20, 50, 20));
	sunLight.intensity = 0.9;
	sunLight.shadowMaxZ = 1000; // Necessary
	// Create & set ambient lighting with tiny intensity level (just so shadowed areas aren't 100% black)
	let ambientLight = utils.createHemisphereLight("ambientLight");
	ambientLight.intensity = 0.025;
	// Create & init shadowGenerator for our single directional light (sunLight)
	let sunLightShadow = new BABYLON.ShadowGenerator(1024 * 4, sunLight);
	sunLightShadow.useContactHardeningShadow = true;
	sunLightShadow.darkness = 0.25; // Lower value = darker shadows (counter-intuitive)
	// Adjust biases to reduce shadow artifacts (light bleeding or acne)
	sunLightShadow.bias = 0.0002;
	sunLightShadow.normalBias = 0.0001;
	game.shadowGenerators.push(sunLightShadow);

	/* MESHES & PHYSICSIMPOSTORS */
	// Create ground surface
	utils.generateBox(
		"ground", vec3(50,1,50), vec3(0,-0.5,0),
		utils.createMat("groundMat", utils.newHexColor("#448844"))
	);
	// Load player mesh into player.mesh & create physicsImpostor for player.body
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_default.glb", scene, undefined, undefined).then((result) => {
		const meshScale = gameSettings.defaultPlayerScale * player.scale;
		result.meshes[1].name = result.meshes[1].id = "playerMesh"; // Manually set mesh name & id to playerMesh
		result.meshes[1].receiveShadows = true; // Enable shadows on actual mesh geometry
		player.mesh = result.meshes[0]; // Initialize player.mesh with loaded mesh
		player.mesh.scaling = vec3(meshScale*2, meshScale*2, meshScale*2); // Scales player model up x2 (originally tiny)
		player.mesh.skeleton = result.skeletons[0]; // Init & store skeleton object
		player.mesh.skeleton.enableBlending(1); // Set animation blending speed

		// Create a dummy cube to parent the camera to, which is then tied to the player (and enables us to offset the camera)
		const cameraOffset = player.mesh.position.addInPlace(gameSettings.defaultCamOffset);
		const offsetMesh = BABYLON.MeshBuilder.CreateBox("camOffset",{size:0.01},scene);
		offsetMesh.position = cameraOffset;offsetMesh.parent = player.mesh;
		offsetMesh.checkCollisions = false;offsetMesh.isVisible = false;
		game.shadowGenerators[0].addShadowCaster(result.meshes[1]);
		player.camera.setTarget(offsetMesh); // Set camera target to offset mesh, which is parented to player.mesh

		// Create simple box collider for player movement and collision handling
		// TODO: adjust bounding box height for dif animations? aka jumping, crouch, etc
		player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175 * player.scale, height: 0.4 * player.scale, depth: 0.6 * player.scale},scene);
		player.body.physicsImpostor = new BABYLON.PhysicsImpostor(
			player.body, BABYLON.PhysicsImpostor.BoxImpostor,
			// TODO: We currently set friction to 0 & use custom friction in movement.js... Maybe fix this so using object friction values isn't totally useless on the player?
			{ mass: gameSettings.defaultPlayerMass, friction: 0, restitution: 0 },scene
		);
		player.body.physicsImpostor.angularDamping = 0; // Zero damping for instant turning
		player.body.isVisible = gameSettings.debugMode; // Initialize player.body visibility based on initial `debugMode` status
		player.body.position = gameSettings.defaultSpawnPoint;
		player.body.rotationQuaternion = new BABYLON.Quaternion(0,0,0,1);
	});
	// Load default 1x1 meter cube from Blender (for world size/scale calibration)
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "defaultCube_1x1.glb", scene, undefined, undefined).then((result) => {
		let resultMesh = result.meshes[1];
		let boundingBox = resultMesh.getBoundingInfo().boundingBox;
		let bbWidth = boundingBox.maximum.x - boundingBox.minimum.x;
		let bbHeight = boundingBox.maximum.y - boundingBox.minimum.y;
		let bbDepth = boundingBox.maximum.z - boundingBox.minimum.z;
		const colliderMesh = BABYLON.MeshBuilder.CreateBox("cubeCollider",{width:bbWidth, height:bbHeight, depth:bbDepth},scene);
		new BABYLON.PhysicsImpostor(colliderMesh,BABYLON.PhysicsImpostor.BoxImpostor,{mass:0},scene);
		colliderMesh.isVisible = false;
		colliderMesh.parent = result.meshes[1];
		resultMesh.position = vec3(0, 1, 5);
		resultMesh.receiveShadows = true;
		game.shadowGenerators[0].addShadowCaster(resultMesh, true);
	});
	// Load wall test (for further calibration) TODO: Fix boundingBox info to assign proper colliderMesh size (only working with cube currently)
	/*await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "wall.glb", scene, undefined, undefined).then((result) => {
		let resultMesh = result.meshes[1];
		let boundingBox = resultMesh.getBoundingInfo().boundingBox;
		let bbWidth = boundingBox.maximum.x - boundingBox.minimum.x;
		let bbHeight = boundingBox.maximum.y - boundingBox.minimum.y;
		let bbDepth = boundingBox.maximum.z - boundingBox.minimum.z;
		console.log(boundingBox);
		const colliderMesh = BABYLON.MeshBuilder.CreateBox("wallCollider",{width:bbWidth, height:bbHeight, depth:bbDepth},scene);
		new BABYLON.PhysicsImpostor(colliderMesh,BABYLON.PhysicsImpostor.BoxImpostor,{mass:0},scene);
		colliderMesh.isVisible = false;
		colliderMesh.parent = result.meshes[1];
		resultMesh.position = vec3(0, 0, 5);
	});*/

	/* REGISTER INPUT, WINDOW, ANIMATION & DEBUG HANDLERS */
	animation.initAnimations();
	inputs.initWindowFunctions();
	inputs.initKeyboardListeners();
	screen.initScreenElements();

	// Initialize game.excludeFromRayResults to prevent `utils.rayCast(...).hit` from returning these mesh(es)
	game.excludeFromRayResults.push(
		scene.getMeshByName("playerMesh"), // Player mesh
		scene.getMeshByName("playerBody"), // Player body physicsImpostor
		scene.getMeshByName("camOffset"), // Mesh that the camera targets
	);

	// Draw axisHelpers if `debugMode` = true during scene creation
	if(gameSettings.debugMode) utils.showAxisHelper(10, vec3(10,2.5, 10));

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
		// STILL bugged, when ignoring playerBody mesh, none of the following code is called???
		// TODO: Use something other than player.body.physicsImpostor to add registerBeforePhysicsStep to?
		console.log("About to collide with: ", impostor.object.name);
		let invalidMesh = scene.getMeshByName("playerBody");
		if(impostor === invalidMesh.physicsImpostor) return;
	});*/

	// player body ON PHYSICS COLLIDE with other physicsImpostors
	player.body.physicsImpostor.registerOnPhysicsCollide(scene.meshes.filter(() => scene.getMeshByName("playerBody") || scene.getMeshByName("playerMesh")).map(mesh => mesh.physicsImpostor), (collider, collidedAgainst) => {
		// Note: This code also caused HUGE dips in FPS
		if(gameSettings.debugMode)console.log("COLLISION! 💥 '", collider.object.name, "' collided against '", collidedAgainst.object.name, "'");
		// Check if we are colliding with a surface below us or not
		const collidedMesh = collidedAgainst.object; if (!collidedMesh) return;
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
