import * as utils from "./utils.js";
import * as inputs from "./input.js";
import * as movement from "./movement.js";

export const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
export const engine = new BABYLON.Engine(canvas, true, {
	deterministicLockstep: true,lockstepMaxSteps: 4,
	/* For testing shaders, enable: preserveDrawingBuffer: true,stencil: true,disableWebGL2Support: false*/
});// Init 3D engine
export const scene = new BABYLON.Scene(engine);// This creates a basic Babylon Scene object (non-mesh)
export let game = {
	controls: {
		forward: "KeyW",left: "KeyA",back: "KeyS",right: "KeyD",
		jump: "Space",sprint: "ShiftLeft",
		developerMenu: "Tab",
	},
	time: 0,
	lastFrameTime: 0,
	frameRateLimit: (1000 / 60),
	debugMode: false,
	colliders: null,
	shadowGenerator: null,
	defaultGravity: new BABYLON.Vector3(0, -9.81, 0), // Set gravity
};
export let player = {
	mesh: null, //initialized below
	body: null, //initialized below
	movement: {
		onGround: false,
		canMove: true,
		canJump: false,
		isMoving: false,
		jumping: false,
		sprinting: false,
		forward: false,
		back: false,
		left: false,
		right: false,
	},
	curMoveSpeed: 1,
	defaultMoveSpeed: 1,
	sprintSpeed: 3,
	maxVelocity: 10,
	speed: 0,
	jumpHeight: 3.5,
	movementDirection: BABYLON.Vector3.Zero(),
	curAnimation: "cat_idleStandA",
	camera: new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2,  // Alpha (horizontal rotation)
		Math.PI / 3,  // Beta (vertical rotation)
		6,           // Radius (distance from the target)
		undefined, // Target (initialized later)
		scene
	),
};

// TODO: Possibly move createScene function code into utils.js or further segment code into chunks
const createScene = async () => {
	// PHYSICS AND GRAVITY
	scene.enablePhysics(game.defaultGravity, new BABYLON.CannonJSPlugin()); // Using Cannon.js for physics

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
	let groundMesh = BABYLON.MeshBuilder.CreateBox("ground", {width: 50, height: 5, depth: 50}, scene);
	let groundMat = new BABYLON.StandardMaterial("myMaterial", scene);
	groundMat.diffuseColor = BABYLON.Color3.FromHexString("#44aa33");
	groundMesh.receiveShadows = true;
	groundMesh.position.y = 0;
	groundMesh.material = groundMat;
	groundMesh.checkCollisions = true; // Enable collision detection
	groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
		groundMesh,	BABYLON.PhysicsImpostor.BoxImpostor, {
			mass: 0, friction: 0.95, restitution: 0.05
		}, scene
	);

	// Generate random platforms for testing player movement
	let obstacleCount = 100, obRange = [25, 5, 25], obSizeRange = [[0.1, 5], [0.1, 0.1], [0.1, 5]];
	for(let i=0;i<obstacleCount;i++){
		let curObstCol = utils.newColor(utils.getRandomColor());
		let randSizeX = obSizeRange[0][0] + (Math.random() * (obSizeRange[0][1]-obSizeRange[0][0]));
		let randSizeY = obSizeRange[1][0] + (Math.random() * (obSizeRange[1][1]-obSizeRange[1][0]));
		let randSizeZ = obSizeRange[2][0] + (Math.random() * (obSizeRange[2][1]-obSizeRange[2][0]));
		let curObst = BABYLON.MeshBuilder.CreateBox("obst_"+i, {width: randSizeX, height: randSizeY, depth: randSizeZ}, scene);
		let curObx = Math.random() * obRange[0], curOby = 10 + Math.random() * obRange[1], curObz = Math.random() * obRange[2];
		curObst.physicsImpostor = new BABYLON.PhysicsImpostor(
			curObst, BABYLON.PhysicsImpostor.BoxImpostor, {
			mass: 4, friction: 0.75, restitution: 0.3
			}, scene
		);
		curObst.position = new BABYLON.Vector3(curObx - (obRange[0]/2), curOby, curObz - (obRange[2]/2));
		utils.createMat(curObst, curObstCol);
	}

	// Load player mesh into player.mesh & create physicsImpostor for player.body
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_full.glb", scene, undefined, undefined, "playerMesh").then((result) => {
		player.mesh = result.meshes[0];// Initialize player.mesh with loaded mesh
		player.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
		player.mesh.skeleton = scene.getSkeletonByName("Cat model");// Init & store skeleton object
		player.mesh.skeleton.enableBlending(1);
		player.camera.setTarget(player.mesh);// Set camera target to player mesh after being loaded
	});
	// TODO: adjust bounding box height for dif animations? aka jumping, crouch, etc
	player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175, height: 0.4, depth: 0.6},scene);
	player.body.position.y = 5;
	player.body.physicsImpostor = new BABYLON.PhysicsImpostor(
		player.body,
		BABYLON.PhysicsImpostor.BoxImpostor, // Choose the appropriate shape
		{ mass: 2, friction: 0, restitution: 0 },      // Adjust mass and physics properties
		scene
	);
	player.body.isVisible = game.debugMode;

	// INITIALIZE ANIMATION HANDLING
	// TODO: Initialize animation handling here?

	// ANIMATION BLENDING (blends ALL loaded anims in the scene)
	for (let animCounter = 0; animCounter < scene.animationGroups.length; animCounter++) {
		for (let index = 0; index < scene.animationGroups[animCounter].targetedAnimations.length; index++) {
			let animation = scene.animationGroups[animCounter].targetedAnimations[index].animation
			animation.enableBlending = true;
			animation.blendingSpeed = 0.1;
		}
	}


	// Store all initialized physics colliders/impostors inside game object (update this as more are added to the scene)
	// TODO: If adding more physicsImpostors outside of the createScene function, update game.colliders value
	game.colliders = scene.meshes.filter(mesh => mesh.physicsImpostor).map(mesh => mesh.physicsImpostor);

	// Init debug helpers
	if(game.debugMode) {
		utils.showAxisHelper(10, scene);
		console.log("Skeletons: ", scene.skeletons);
		console.log("AnimGroups: ", scene.animationGroups);
	}

	// Register user input handlers and init window event handlers
	inputs.initWindowFunctions();
	inputs.initEventListeners();

	return scene;
};

// Run scene functions AFTER createScene() is finished
createScene().then((scene) => {
	// BEFORE scene renders frame (avoid putting code here as much as possible)
	scene.onBeforeRenderObservable.add(() => {
		game.time = performance.now();
		const deltaTime = game.time - game.lastFrameTime;
		if (deltaTime > game.frameRateLimit) {
			// PUT LOGIC HANDLING CODE HERE, LIMITED TO 60FPS
			movement.handleMovement();
			game.lastFrameTime = game.time - (deltaTime % game.frameRateLimit);
		}
		movement.handleRotation(); // Handle rotation every frame
		movement.syncMeshAndBody();
		utils.checkCanJump();// Checks if onGround every frame & sets onGround, canMove, and canJump
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
	player.body.physicsImpostor.registerOnPhysicsCollide(scene.meshes.filter(mesh => mesh.physicsImpostor).map(mesh => mesh.physicsImpostor), (collider, collidedAgainst) => {
		if(game.debugMode)console.log("Collided against: ",collidedAgainst.object.name);
	});
});
