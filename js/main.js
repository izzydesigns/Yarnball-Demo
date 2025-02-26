import {gameSettings, scene, game, player, engine} from "./globals.js";
import * as inputs from "./eventListeners.js";
import * as animation from "./animation.js";
import * as movement from "./movement.js";
import * as screen from "./screen.js";
import * as utils from "./utils.js";
import {quat, vec3, getSurfaceNormal} from "./utils.js";

await utils.initEngineAndScene();
(async () => {

	utils.initPlayerCamera();
	utils.enableDefaultLighting(); // TODO: Eventually remove this & properly load all lights from the level mesh itself
	utils.createSkybox("res/skybox/Sky_LosAngeles"); // TODO: Also put this inside the map itself, for consistency sake

	// Loads player.mesh & create physicsImpostor for player.body
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
		offsetMesh.isVisible = false;
		game.shadowGenerators[0].addShadowCaster(result.meshes[1]);
		player.camera.setTarget(offsetMesh); // Set camera target to offset mesh, which is parented to player.mesh

		// Create simple box collider for player movement and collision handling TODO: adjust bounding box height for dif animations? aka jumping, crouch, etc
		player.body = BABYLON.MeshBuilder.CreateBox("playerBody",{width: 0.175 * player.scale, height: 0.4 * player.scale, depth: 0.6 * player.scale},scene);
		// TODO: `friction = 0` currently (custom friction used in `movement.js` instead), so any object friction against the player's physics impostor is zero
		player.body.physicsImpostor = new BABYLON.PhysicsImpostor(player.body, BABYLON.PhysicsImpostor.BoxImpostor,{
			mass: gameSettings.defaultPlayerMass, friction: 0, restitution: 0
		},scene);
		player.body.physicsImpostor.angularDamping = 0; // Zero damping for instant turning
		player.body.isVisible = gameSettings.debugMode; // Initialize player.body visibility based on initial `debugMode` status
		player.body.position = gameSettings.defaultSpawnPoint; // Teleport mesh to defaultSpawnPoint if the level being loaded does not specify a spawn point
	});

	// Loads first level, and handles collision enabling, triggers, and lighting
	await BABYLON.SceneLoader.ImportMeshAsync("", "../res/models/", "first_level.glb", scene).then((result) => {
		let collisionParent = new BABYLON.TransformNode("level1 colliders", scene); // Creates parent object for all colliders
		//let triggerParent = new BABYLON.TransformNode("level1 triggers", scene); // Creates parent object for all triggers

		// Get meshes & create colliders for submeshes ending with "_collider" (REMEMBER: ctrl + a -> apply scale + 'set origin to geometry' before exporting!!!)
		for(let curGeo of result.meshes){
			if(curGeo.name.startsWith("Level")){
				let levelMesh = curGeo; // Get actual level geometry mesh
				levelMesh.material.maxSimultaneousLights = 64; // Enable all lights on mesh
				levelMesh.receiveShadows = true; // Enable shadows on main level mesh
				game.shadowGenerators[0].addShadowCaster(levelMesh); // Enable shadow casting on the mesh as well
			}else
			if(curGeo.name.endsWith("_collider")) { // || endsWith("_trigger")
				if(curGeo.name.startsWith("Cube")){
					// Handle cube colliders
					let colliderBB = curGeo.getBoundingInfo().boundingBox;
					let bbWidth = colliderBB.maximum.x - colliderBB.minimum.x,bbHeight = colliderBB.maximum.y - colliderBB.minimum.y,bbDepth = colliderBB.maximum.z - colliderBB.minimum.z;
					const colliderMesh = BABYLON.MeshBuilder.CreateBox(curGeo.name,{width:bbWidth, height:bbHeight, depth:bbDepth},scene);
					colliderMesh.position = colliderBB.centerWorld; // Set new mesh pos to match the current BB pos
					colliderMesh.rotationQuaternion = curGeo.rotationQuaternion.conjugate(); // Updates colliderMesh rotation to the inverse of the geometry's rotation value
					colliderMesh.scaling = curGeo.absoluteScaling;
					curGeo.visibility = colliderMesh.visibility = 0; // Hide geometry & new mesh
					new BABYLON.PhysicsImpostor(colliderMesh,BABYLON.PhysicsImpostor.BoxImpostor,{mass:0},scene); // Create physicsImpostor for colliderMesh
					colliderMesh.parent = collisionParent; // Set parent object to group everything together
				}else if(curGeo.name.startsWith("Icosphere")){
					// Handle `icosphere` sphere colliders
					let boundingBox = curGeo.getBoundingInfo().boundingBox;
					let radius = curGeo.getBoundingInfo().boundingSphere.radius;
					let colliderMesh = BABYLON.MeshBuilder.CreateSphere("collider", { diameter: radius * 1.1 }, scene);
					colliderMesh.position = boundingBox.centerWorld; // Set new mesh pos to match the current BB pos
					curGeo.visibility = colliderMesh.visibility = 0; // Hide collider but keep it active
					let sphereImpostor = new BABYLON.PhysicsImpostor(
						colliderMesh,
						BABYLON.PhysicsImpostor.SphereImpostor,
						{ mass: 0, friction: 0.5, restitution: 0.3 },
						scene
					);
					sphereImpostor.position = boundingBox.centerWorld; // Set new mesh pos to match the current BB pos
					sphereImpostor.rotationQuaternion = curGeo.rotationQuaternion.conjugate(); // Invert rotation if needed
				}
			}
		}
		// Load & parse misc data (powerup positions, spawn position, lighting info, etc)
		for(let data of result.transformNodes){
			if(data.name === "Spawnpoint") utils.teleportPlayer(data.absolutePosition);
		}
		// Load scene lights (and fix intensity)
		for(let light of result.lights){
			light.intensity *= 0.0025; // Fix for intensity scaling issue, adjust as necessary
			// Create shadow casters? (See: https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows#point-lights )
			// TODO: Destroy lights loaded from mesh & use baked lighting instead for most level lights
			//light.dispose();
			// Create new light to replace previous one (might need to grab light data before disposing)
		}
	});

	/* INIT OTHER STUFF */
	animation.initAnimations();
	inputs.initWindowFunctions();
	inputs.initKeyboardListeners();
	screen.initScreenElements();

	return scene;

})().then((scene) => {

	// Begin `engine.runRenderLoop` and call `scene.render()` each frame render
	engine.runRenderLoop(() => scene.render());

	// Called BEFORE the scene renders the next frame (monitor refresh rate = scene's maximum render speed)
	scene.onBeforeRenderObservable.add(() => {
		game.time = performance.now();
		const deltaTime = performance.now() - game.lastFrameTime;
		if (deltaTime > game.frameRateLimit) { // Executed once every 16.6 milliseconds (60fps)
			game.lastFrameTime = game.time - (deltaTime % game.frameRateLimit);
			// Handle animations, movement, & screen menus
			animation.handleAnimations();movement.handleMovement();screen.updateMenus();
		}
		movement.handleRotationAndPosition(); // Handle rotation & position assignment EVERY frame
		utils.checkCameraCollision(); // Checks for camera collision every frame (serves as our own `checkCollisions` function, as that is no longer enabled)
	});

	// Register `player.body` collide event (filters out `player.body` and `player.mesh` from calculations)
	player.body.physicsImpostor.registerOnPhysicsCollide(scene.meshes.filter(() => scene.getMeshByName("playerBody") || scene.getMeshByName("playerMesh")).map(mesh => mesh.physicsImpostor), (collider, collidedAgainst) => {
		// TODO: See `movement.js` line 152 and consider finding a way to move this code over to there
		if(gameSettings.debugMode)console.log("COLLISION! 💥 '", collider.object.name, "' collided against '", collidedAgainst.object.name, "'");
		// Check if we are colliding with a surface below us or not
		const collidedMesh = collidedAgainst.object; if (!collidedMesh) return;
		// Calculate the surface normal of the collided mesh
		const surfaceNormal = getSurfaceNormal(collidedMesh, 3, false); if (!surfaceNormal) return;
		let isOnSlant = player.tiltDegrees >= gameSettings.defaultMaxSlopeAngle;
		if(gameSettings.debugMode)console.log("isSliding?", isOnSlant, "angleDeg:", player.tiltDegrees, "maxAngle:", gameSettings.defaultMaxSlopeAngle);
		if(isOnSlant) {
			player.movement.isSliding = true;
			player.onGround = false;
		}
	});

	// BEFORE PHYSICS CALCULATION for player body physicsImpostor
	/*player.body.physicsImpostor.registerBeforePhysicsStep((impostor) => {
		// STILL bugged, none of the following code is called???
		console.log("About to collide with: ", impostor.object.name);
	});*/

}, (err) => {console.error("Unable to `createScene()`, reason: ",err)});
