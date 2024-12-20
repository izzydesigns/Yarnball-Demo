const canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
const engine = new BABYLON.Engine(canvas, true, {
	deterministicLockstep: true,
	lockstepMaxSteps: 4,
	preserveDrawingBuffer: true,
	stencil: true,
	disableWebGL2Support: false
});// Init 3D engine
const scene = new BABYLON.Scene(engine);// This creates a basic Babylon Scene object (non-mesh)
// initialize the plugin using the HavokPlugin constructor

let game = {
	controls: {
		forward: "w",
		left: "a",
		back: "s",
		right: "d",
		jump: " ",
	},
	defaultGravity: new BABYLON.Vector3(0, -9.81, 0), // Set gravity
};
let player = {
	mesh: null, //initialized below
	body: null, //initialized below
	movement: {
		canMove: true,
		isMoving: false,
		forward: false,
		back: false,
		left: false,
		right: false,
		jumping: false,
	},
	moveSpeed: 5,
	maxVelocity: 10,
	velocity: null,
	speed: null,
	jumpHeight: 200,
	camera: new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2,  // Alpha (horizontal rotation)
		Math.PI / 3,  // Beta (vertical rotation)
		10,           // Radius (distance from the target)
		undefined, // Target (cat model position)
		scene
	),
};

const playAnimation = (name) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group) {
		group.start(true); // Play the animation in loop
		//console.log(`Playing animation: ${name}`);
	} else {
		console.warn(`Animation group "${name}" not found.`);
	}
};// Play a specific animation group by name
const stopAnimation = (name) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group) {
		group.stop();
		//console.log(`Stopped animation: ${name}`);
	} else {
		console.warn(`Animation group "${name}" not found.`);
	}
};// Stop a specific animation group by name
const stopAnimAfterDone = (name) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group && group.isPlaying) {
		// Wait until the animation ends, then stop it
		group.onAnimationEndObservable.addOnce(() => {
			group.stop();
			//console.log(`Stopped animation: ${name}`);
		});
	} else {
		console.warn(`Animation group "${name}" not found.`);
	}
};
const isAnimationPlaying = (name) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group) {
		//console.log(`${name} is ${group.isPlaying ? "playing" : "not playing"}`);
		return group.isPlaying;
	} else {
		console.warn(`Animation group "${name}" not found.`);
		return false;
	}
};// Check if a specific animation group is currently playing

const createScene = async () => {
	// PHYSICS AND GRAVITY
	//const havokInstance = await HavokPhysics();
	//const hk = new BABYLON.HavokPlugin(true, havokInstance);// pass the engine to the plugin
	//scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);// enable physics in the scene with a gravity
	scene.enablePhysics(game.defaultGravity, new BABYLON.CannonJSPlugin()); // Using Cannon.js for physics

	// CAMERA
	player.camera.attachControl(canvas, true); // Attach camera controls to the canvas
	player.camera.wheelPrecision = 150;
	player.camera.lowerRadiusLimit = 1;//how close can the camera come to player
	player.camera.upperRadiusLimit = 4;//how far can the camera go from the player
	player.camera.checkCollisions = true;//moves camera closer if being obscured by geometry

	// LIGHTING
	let light = new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(3, 20, 10), scene);
	light.intensity = 0.8;

	function showAxisHelper(size) {
		let makeTextPlane = (text, color, size) => {
			let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
			dynamicTexture.hasAlpha = true;
			dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
			let plane = new BABYLON.MeshBuilder.CreatePlane("TextPlane", { size }, scene);
			plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);plane.material.backFaceCulling = false;
			plane.material.specularColor = new BABYLON.Color3(0, 0, 0);plane.material.diffuseTexture = dynamicTexture;
			return plane;
		};
		const createAxis = (name, points, color, label, labelPos, labelColor) => {
			let axis = BABYLON.MeshBuilder.CreateLines(name, { points }, scene);axis.color = color;
			let char = makeTextPlane(label, labelColor, size / 10);char.position = labelPos;
			return axis;
		};
		createAxis("axisX", [
			new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
			new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
		], new BABYLON.Color3(1, 0, 0), "X", new BABYLON.Vector3(0.9 * size, 0.05 * size, 0), "red");
		createAxis("axisY", [
			new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
			new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
		], new BABYLON.Color3(0, 1, 0), "Y", new BABYLON.Vector3(0, 0.9 * size, -0.05 * size), "green");
		createAxis("axisZ", [
			new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
			new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
		], new BABYLON.Color3(0, 0, 1), "Z", new BABYLON.Vector3(0, 0.05 * size, 0.9 * size), "blue");
	}
	showAxisHelper(10);


	// LOAD WORLD GEOMETRY AND MESHES
	let groundMesh = BABYLON.MeshBuilder.CreateBox("ground", {width: 500, height: 5, depth: 500}, scene);
	let groundMat = new BABYLON.StandardMaterial("myMaterial", scene);
	groundMat.diffuseColor = BABYLON.Color3.FromHexString("#44aa33");
	groundMesh.receiveShadows = true;
	groundMesh.position.y = -5;
	groundMesh.material = groundMat;
	groundMesh.checkCollisions = true; // Enable collision detection
	groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(groundMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.95, restitution: 0.05 }, scene);
	//const groundAggregate = new BABYLON.PhysicsAggregate(groundMesh, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.75, restitution: 0.3 }, scene);

	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "cat_full.glb", scene, undefined, undefined, "playermodel").then((result) => {
		player.mesh = result.meshes[0];// Initialize player.mesh with loaded mesh
		player.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
		player.mesh.skeleton = scene.getSkeletonByName("Cat model");// Init & store skeleton object
		player.mesh.skeleton.enableBlending(1);

		playAnimation("cat_idleStandA");// Initialize animation with default idle
		player.camera.setTarget(player.mesh);// Set camera target to player mesh after being loaded
	});

	// Estimated bounding box for mesh
	// TODO: Ensure animations other than walking work correctly
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
			animation.blendingSpeed = 0.02;
		}
	}

	console.log("Skeletons: ",scene.skeletons);
	//console.log("AnimGroups: ",scene.animationGroups);
	return scene;
};

// Run scene functions AFTER createScene() is finished
createScene().then((scene) => {
	engine.runRenderLoop(() => {
		player.speed = 0;
		player.velocity = 0;

		if (player.movement.isMoving) {// Check if the player is moving
			// Get camera alpha value and calculate movement directions
			let movementDirection = BABYLON.Vector3.Zero();
			const cameraRotation = -player.camera.alpha;
			const forward = new BABYLON.Vector3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
			const right = new BABYLON.Vector3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();

			// Accumulate movement based on input
			if (player.movement.right) movementDirection.addInPlace(forward);// Move forward along the camera's forward axis
			if (player.movement.left) movementDirection.addInPlace(forward.scale(-1));// Move backward along the camera's forward axis
			if (player.movement.back) movementDirection.addInPlace(right.scale(-1));// Move left along the camera's right axis
			if (player.movement.forward) movementDirection.addInPlace(right);// Move right along the camera's right axis

			// Normalize to maintain consistent speed regardless of diagonal movement
			if (!movementDirection.equals(BABYLON.Vector3.Zero())) {
				movementDirection.normalize().scaleInPlace(player.moveSpeed);
			}
			const currentVelocity = player.body.physicsImpostor.getLinearVelocity();// Get current velocity, retain y-axis (for gravity)
			const newVelocity = new BABYLON.Vector3(movementDirection.x, /*currentVelocity.y*/0, movementDirection.z);
			player.speed = currentVelocity.length();
			player.velocity = (player.speed === 0 ? BABYLON.Vector3.Zero() : newVelocity.clone().normalize());

			// TODO: Fix bouncy physics while moving on flat ground!!!! look into registerOnPhysicsCollide
			//console.log(player.speed, player.velocity);
			player.body.physicsImpostor.setLinearVelocity(newVelocity);// Apply the new velocity

			// Rotation to match the movement direction
			const rotationSpeed = 0.025;// Adjust for faster/slower turning
			const desiredRotation = BABYLON.Quaternion.FromEulerAngles(0, Math.atan2(movementDirection.normalize().x, movementDirection.normalize().z), 0);
			player.body.rotationQuaternion = BABYLON.Quaternion.Slerp(player.body.rotationQuaternion, desiredRotation, rotationSpeed);
			player.body.physicsImpostor.registerBeforePhysicsStep(() => {
				player.body.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());// Keeps rotation locked to Y axis only
			});
		}

		scene.render();// Render the scene
	});

	scene.onBeforeRenderObservable.add(() => {
		// Synchronizes the player.mesh position and rotation with the player.body physicsImpostor
		player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);// Mesh animation position normalization
		player.mesh.position = new BABYLON.Vector3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);// Align mesh with body, adjusted Y value to match feet on ground
		player.mesh.rotationQuaternion = player.body.rotationQuaternion;
	});
});

// Detect key presses
window.addEventListener("keyup", function(e){
	if(e.key === game.controls.forward || e.key === game.controls.back || e.key === game.controls.left || e.key === game.controls.right){
		if(e.key === game.controls.forward){player.movement.forward = false;}
		if(e.key === game.controls.back){player.movement.back = false;}
		if(e.key === game.controls.left){player.movement.left = false;}
		if(e.key === game.controls.right){player.movement.right = false;}
		if(player.movement.isMoving && (!player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right)) {
			player.movement.isMoving = false;
			stopAnimation("cat_walk");
			playAnimation("cat_idleStandA");
		}
	}
	if(e.key === game.controls.jump){
		player.movement.jumping = false;
	}
});
window.addEventListener("keydown", function(e){
	if (e.repeat) {return;}
	if(e.key === game.controls.forward || e.key === game.controls.back || e.key === game.controls.left || e.key === game.controls.right){
		if(e.key === game.controls.forward){
			player.movement.forward = true;
		}else if(e.key === game.controls.back){
			player.movement.back = true;
		}else if(e.key === game.controls.left){
			player.movement.left = true;
		}else if(e.key === game.controls.right){
			player.movement.right = true;
		}
		player.movement.isMoving = true;
		playAnimation("cat_walk");
	}
	if(e.key === game.controls.jump){
		player.movement.jumping = true;
	}
	if(e.key === "Tab"){
		if(!scene.debugLayer.isVisible()){
			scene.debugLayer.show();
		}else{
			scene.debugLayer.hide();
		}
	}
});

// Handle browser/canvas resize
window.addEventListener("resize", () => {engine.resize();});