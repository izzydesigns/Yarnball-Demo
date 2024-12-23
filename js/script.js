import * as utils from "./utils.js";
import {inputHandler} from "./input.js";

const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
const engine = new BABYLON.Engine(canvas, true, {
	deterministicLockstep: true,lockstepMaxSteps: 4,
	/* For testing shaders, enable: preserveDrawingBuffer: true,stencil: true,disableWebGL2Support: false*/
});// Init 3D engine
const scene = new BABYLON.Scene(engine);// This creates a basic Babylon Scene object (non-mesh)
let game = {
	controls: {
		forward: "w",left: "a",back: "s",right: "d",
		jump: " ",
		developerMenu: "	",
	},
	colliders: null,
	defaultGravity: new BABYLON.Vector3(0, -9.81, 0), // Set gravity
};
let player = {
	mesh: null, //initialized below
	body: null, //initialized below
	movement: {
		canMove: true,
		canJump: true,
		isMoving: false,
		jumping: false,
		forward: false,
		back: false,
		left: false,
		right: false,
	},
	moveSpeed: 5,
	maxVelocity: 10,
	velocity: utils.v0,
	speed: 0,
	jumpHeight: 2,
	camera: new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2,  // Alpha (horizontal rotation)
		Math.PI / 3,  // Beta (vertical rotation)
		10,           // Radius (distance from the target)
		undefined, // Target (cat model position)
		scene
	),
};

const createScene = async () => {
	// PHYSICS AND GRAVITY
	/*const havokInstance = await HavokPhysics();
	const hk = new BABYLON.HavokPlugin(true, havokInstance);// pass the engine to the plugin
	scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);// enable physics in the scene with a gravity*/
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

	utils.showAxisHelper(10, scene);

	// LOAD WORLD GEOMETRY AND MESHES
	let groundMesh = BABYLON.MeshBuilder.CreateBox("ground", {width: 500, height: 5, depth: 500}, scene);
	let groundMat = new BABYLON.StandardMaterial("myMaterial", scene);
	groundMat.diffuseColor = BABYLON.Color3.FromHexString("#44aa33");
	groundMesh.receiveShadows = true;
	groundMesh.position.y = -5;
	groundMesh.material = groundMat;
	groundMesh.checkCollisions = true; // Enable collision detection
	groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(groundMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.95, restitution: 0.05 }, scene);

	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_full.glb", scene, undefined, undefined, "playermodel").then((result) => {
		player.mesh = result.meshes[0];// Initialize player.mesh with loaded mesh
		player.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
		player.mesh.skeleton = scene.getSkeletonByName("Cat model");// Init & store skeleton object
		player.mesh.skeleton.enableBlending(1);

		utils.playAnimation("cat_idleStandA", scene);// Initialize animation with default idle
		player.camera.setTarget(player.mesh);// Set camera target to player mesh after being loaded
	});

	// Estimated bounding box for mesh (TODO: Ensure animations other than walking work correctly)
	player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175, height: 0.4, depth: 0.6},scene);
	player.body.physicsImpostor = new BABYLON.PhysicsImpostor(
		player.body,
		BABYLON.PhysicsImpostor.BoxImpostor, // Choose the appropriate shape
		{ mass: 1, friction: 0.5, restitution: 0 },      // Adjust mass and physics properties
		scene
	);
	player.body.isVisible = false;

	// ANIMATION BLENDING (blends ALL loaded anims in the scene)
	for (let aniCounter = 0; aniCounter < scene.animationGroups.length; aniCounter++) {
		for (let index = 0; index < scene.animationGroups[aniCounter].targetedAnimations.length; index++) {
			let animation = scene.animationGroups[aniCounter].targetedAnimations[index].animation
			animation.enableBlending = true;
			animation.blendingSpeed = 0.1;
		}
	}

	// Register user inputs and handle them in 'input.js'
	inputHandler(game, player, scene);
	// Store all physics colliders/impostors inside game object
	game.colliders = scene.meshes.filter(mesh => mesh.physicsImpostor).map(mesh => mesh.physicsImpostor);

	console.log("Skeletons: ",scene.skeletons);
	console.log("AnimGroups: ",scene.animationGroups);
	return scene;
};

// Run scene functions AFTER createScene() is finished
createScene().then((scene) => {
	// BEFORE scene renders frame (avoid putting code here as much as possible)
	scene.onBeforeRenderObservable.add(() => {

		//utils.checkCanJump(player, scene);

		let movementDirection = utils.v0;
		// Movement and jump logic
		if (player.movement.isMoving) {
			const cameraRotation = -player.camera.alpha;
			const forward = new BABYLON.Vector3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
			const right = new BABYLON.Vector3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();

			if(player.movement.canMove) {
				if (player.movement.right) movementDirection.addInPlace(forward);
				if (player.movement.left) movementDirection.addInPlace(forward.scale(-1));
				if (player.movement.back) movementDirection.addInPlace(right.scale(-1));
				if (player.movement.forward) movementDirection.addInPlace(right);
			}

			// Jump force logic (not currently working)
			/*if (player.movement.canJump && player.movement.jumping) {
				console.log("APPLYING JUMP FORCE TO PLAYER");
				movementDirection.addInPlace((new BABYLON.Vector3.Up()).scale(player.jumpHeight * 2)); // Add vertical force
				player.movement.canJump = false; // Disable jump until grounded
			}*/

			if (!movementDirection.equals(utils.v0)) {movementDirection.normalize().scaleInPlace(player.moveSpeed);}
			const currentVelocity = player.body.physicsImpostor.getLinearVelocity();
			const newVelocity = new BABYLON.Vector3(
				movementDirection.x,
				(player.movement.canJump && player.movement.jumping) ? movementDirection.y : currentVelocity.y,
				movementDirection.z
			);
			player.body.physicsImpostor.setLinearVelocity(newVelocity);

			player.speed = currentVelocity.length();
			player.velocity = player.speed === 0 ? utils.v0 : newVelocity.clone().normalize();

		}

		const rotationSpeed = 0.025;
		const desiredRotation = BABYLON.Quaternion.FromEulerAngles(0, Math.atan2(movementDirection.normalize().x, movementDirection.normalize().z), 0);
		const curRotation = player.body.rotationQuaternion;
		player.body.rotationQuaternion = BABYLON.Quaternion.Slerp(new BABYLON.Quaternion(0, curRotation.y, 0, curRotation.w), desiredRotation, rotationSpeed);
		// Sync mesh rotation with physics body and lock to Y-axis
		player.mesh.rotationQuaternion = player.body.rotationQuaternion;

		// Lock physics body rotation on X and Z axes
		player.body.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, player.body.physicsImpostor.getAngularVelocity().y, 0));
		player.body.physicsImpostor.angularDamping = 1;

		// Sync mesh position with physics body
		player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);
		player.mesh.position = new BABYLON.Vector3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);

		if(utils.debugMode)console.log(player.movement.isMoving?"🟢":"🔴", "isMoving", player.movement.canMove?"🟢":"🔴","canMove", player.movement.jumping?"🟢":"🔴", "jumping", player.movement.canJump?"🟢":"🔴", "canJump");
	});

	// ON FRAME RENDER (avoid putting code here as much as possible)
	engine.runRenderLoop(() => {
		scene.render();// Render the scene
	});

	// BEFORE PHYSICS CALCULATION for physicsImpostor
	player.body.physicsImpostor.registerBeforePhysicsStep(() => {

	});

	// ON PHYSICS COLLIDE with other physicsImpostors
	player.body.physicsImpostor.registerOnPhysicsCollide(game.colliders, () => {

	});
});
