import * as utils from "./utils.js";
import * as inputs from "./eventListeners.js";
import * as movement from "./movement.js";
import * as animation from "./animation.js";
import * as screen from "./screen.js";
import {quat, vec3} from "./utils.js";

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
	defaultMaxSlopeAngle: 35,
	defaultSlopeAngle: 20,
	defaultPlayerScale: 1, // Default amount to scale loaded player mesh up by (in all directions)
	defaultSpawnPoint: vec3(0,2,0), // Used if no "Spawnpoint" data point found in map file
	defaultGravity: vec3(0, -9, 0), // Set gravity to value that `feels` right rather than real world values
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
	staticCamPos: vec3(), // Testing out new camera ideas
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
	utils.initPlayerCamera();

	/* LIGHTING & SHADOWS */
	utils.initDefaultLighting();

	/* SKYBOX */
	utils.createSkybox("res/skybox/Sky_LosAngeles");

	/* MESHES & PHYSICSIMPOSTORS */
	// Load player mesh into player.mesh & create physicsImpostor for player.body
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_default.glb", scene).then((result) => {
		const meshScale = gameSettings.defaultPlayerScale * player.scale;
		result.meshes[1].name = result.meshes[1].id = "playerMesh"; // Manually set mesh name & id to playerMesh
		result.meshes[1].receiveShadows = true; // Enable shadows on actual mesh geometry
		result.meshes[0].name = result.meshes[0].id = "player";
		player.mesh = result.meshes[0]; // Initialize player.mesh with loaded mesh
		player.mesh.scaling = vec3(meshScale*2, meshScale*2, meshScale*2); // Scales player model up x2 (originally tiny)
		player.mesh.skeleton = result.skeletons[0]; // Init & store skeleton object
		player.mesh.skeleton.enableBlending(1); // Set animation blending speed
		result.meshes[1].material.maxSimultaneousLights = 64; // Set max lights on player mesh to 64 (per scene)

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
		player.body.position = gameSettings.defaultSpawnPoint; // Teleport mesh to defaultSpawnPoint if the level being loaded does not specify a spawn point
		player.body.rotationQuaternion = quat(0,0,0,1); // Initialize rotation value to zero
	});
	// Load first level, and handle collision enabling, triggers, and lighting
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "first_level.glb", scene).then((result) => {
		let collisionParent = new BABYLON.TransformNode("level1 colliders", scene); // Creates parent object for all colliders
		let triggerParent = new BABYLON.TransformNode("level1 triggers", scene); // Creates parent object for all triggers
		result.meshes[0].name = result.meshes[0].id = "level1";
		let resultMesh = result.meshes[1]; // Get actual level geometry mesh

		// Get meshes & create colliders for submeshes ending with "_collider" (REMEMBER: ctrl + a -> apply transforms + 'set origin to geometry' before exporting!!!)
		for(let curGeo of result.meshes){
			if(curGeo.name.endsWith("_collider") || curGeo.name.endsWith("_trigger")) {
				let colliderBB = curGeo.getBoundingInfo().boundingBox;
				let bbWidth = colliderBB.maximum.x - colliderBB.minimum.x;
				let bbHeight = colliderBB.maximum.y - colliderBB.minimum.y;
				let bbDepth = colliderBB.maximum.z - colliderBB.minimum.z;
				const colliderMesh = BABYLON.MeshBuilder.CreateBox(curGeo.name,{width:bbWidth, height:bbHeight, depth:bbDepth},scene);
				colliderMesh.position = colliderBB.centerWorld; // Set new mesh pos to match the current BB pos
				curGeo.visibility = 0; // Hide collider mesh itself TODO: just make it invisible in the mesh itself via blender??? (tried, but not working?)
				colliderMesh.visibility = 0; // Also hide newly created mesh
				if(curGeo.name.endsWith("_collider")){
					if(gameSettings.debugMode)console.log("Loading collider geometry named: "+curGeo.name);
					// Create physicsImpostor for colliderMesh
					new BABYLON.PhysicsImpostor(colliderMesh,BABYLON.PhysicsImpostor.BoxImpostor,{mass:0},scene);
					colliderMesh.parent = collisionParent; // Set parent object to group everything together
				}else if(curGeo.name.endsWith("_trigger")){
					if(gameSettings.debugMode)console.log("LOADED TRIGGER DATA: ",curGeo.name, curGeo);
					// Create collision event action when `player.mesh` enters current `colliderMesh`
					utils.createMeshEvent(colliderMesh, "onEnter", player.mesh, function () {
						let camName = curGeo.name.replace("_trigger", "_camera");
						let camNode = result.transformNodes.find(node => node.name === camName); // Finds matching _camera node
						if (camNode) player.staticCamPos = camNode.absolutePosition; // Sets staticCamPos to the cooresponding node's position
					});
					colliderMesh.parent = triggerParent; // Set parent object to group everything together
				}

			}
		}
		// Load & parse misc data (powerup positions, spawn position, lighting info, etc)
		for(let data of result.transformNodes){
			if(gameSettings.debugMode)console.log("data",data.name);
			if(data.name === "Spawnpoint") utils.teleportPlayer(data.absolutePosition);
		}
		// Load scene lights (and fix intensity)
		for(let light of result.lights){
			if(gameSettings.debugMode)console.log("Loaded level light: "+light.name, light);
			light.intensity *= 0.0025; // Fix for intensity scaling issue, adjust as necessary
			// Create shadow casters for each light as well?
		}

		resultMesh.material.maxSimultaneousLights = 64; // Enable all lights on mesh
		resultMesh.receiveShadows = true; // Enable shadows on main level mesh
		game.shadowGenerators[0].addShadowCaster(resultMesh);
	});

	// Add exclusions to `game.excludeFromRayResults` to prevent `utils.rayCast(...).hit` from returning the specified mesh(es)
	game.excludeFromRayResults.push(
		scene.getMeshByName(player.mesh.getChildren()[0].getChildren()[2].name), // `player.mesh` mesh name (named `playerMesh`)
		scene.getMeshByName(player.body.name), // `player.body.name` (named `playerBody`)
		scene.getMeshByName(player.mesh.getChildren()[1].name), // Mesh that the camera targets (named `camOffset`)
	);

	/* INIT OTHER MISC HANDLERS */
	animation.initAnimations();
	inputs.initWindowFunctions();
	inputs.initKeyboardListeners();
	screen.initScreenElements();

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
		// Lock camera position to staticCamPos at all times (just testing for now)
		player.camera.position = player.staticCamPos;
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
