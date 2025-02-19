import {canvas, engine, game, gameSettings, player, scene} from "./main.js";

//===================================//
// SCENE HELPERS/SHORTHAND VARIABLES //
//===================================//
/**
 * @desc Shorthands for `BABYLON.Vector3.Up()`, `.Down()`, etc
 * @type {{up: BABYLON.Vector3, down: BABYLON.Vector3, right: BABYLON.Vector3, left: BABYLON.Vector3, forward: BABYLON.Vector3, backward: BABYLON.Vector3}}
 * @example
 * vec.up;
 * // instead of:
 * BABYLON.Vector3.Up();
 */
export let vec = {
	up: vec3(0,1,0),
	down: vec3(0,-1,0),
	right: vec3(1,0,0),
	left: vec3(-1,0,0),
	forward: vec3(0,0,1),
	backward: vec3(0,0,-1),
}
/**
 * @desc Shorthand for `new BABYLON.Vector3(x,y,z)`, use `vec3(x,y,z)` instead for brevity
 * @desc Default values are `0,0,0`, so `vec3()` is equivalent to `BABYLON.Vector3.Zero()`
 */
export function vec3(x=0,y=0,z=0){return new BABYLON.Vector3(x,y,z);}
/**
 * @todo update this
 */
export function quat(x=0,y=0,z=0,w=0){return new BABYLON.Quaternion(x,y,z,w);}
/**
 * @description Pauses the game using `engine.stopRenderLoop()`, and sets `scene.animationsEnabled` to `false` to pause animations.
 * @see https://doc.babylonjs.com/typedoc/classes/BABYLON.Engine#stoprenderloop Babylon API documentation.
 */
export function pauseScene() {
	engine.stopRenderLoop(); // Pause game's render loop
	scene.animationsEnabled = false; // Temporarily disables animations
	if(gameSettings.debugMode) console.log("Window/tab has been minimized, scene should pause...");
}
/**
 * @description Resumes the game using `engine.runRenderLoop(() => scene.render());`, and sets `scene.animationsEnabled` to `true` to resume animations.
 * @see https://doc.babylonjs.com/typedoc/classes/BABYLON.Engine#runrenderloop Babylon API documentation.
 */
export function resumeScene() {
	engine.runRenderLoop(() => scene.render()); // Resume rendering
	scene.animationsEnabled = true; // Resumes scene animations
	if(gameSettings.debugMode) console.log("Window/tab is visible again! Resume the scene.");
}
/**
 * @description Raycasting helper function, specify a `mesh`, `rayDirection`, and `rayLength`, while optionally specifying more `excludedMeshes` to ignore during raycast.
 * @param {BABYLON.Mesh} mesh Which mesh to raycast from (mesh's origin is used for ray origin)
 * @param {BABYLON.Vector3} rayDirection Which direction to raycast from
 * @param {number} rayLength How far (in scene units) to cast ray
 * @param {array} excludedMeshes (Optional) Extra mesh objects to exclude from raycast
 * @returns Returns the result of `scene.pickWithRay` on the desired `mesh` with the specified arguments
 * @see https://doc.babylonjs.com/typedoc/functions/BABYLON.PickWithRay Babylon API documentation.
 */
export function rayCast(mesh, rayDirection, rayLength, excludedMeshes = game.excludeFromRayResults){
	let ray = new BABYLON.Ray(mesh.position.clone(),rayDirection,rayLength);
	return scene.pickWithRay(ray, (mesh) => !excludedMeshes.includes(mesh)); // Return final hit result of ray
}
/** @todo update this */
export function createSkybox(rootUrl, size=1024) {
	const skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:size}, scene);
	const skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(rootUrl, scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;
}
/** @todo update this */
export function initPlayerCamera() {
	player.camera = new BABYLON.ArcRotateCamera(
		"camera",
		Math.PI / 2, // Alpha (horizontal rotation)
		Math.PI / 3, // Beta (vertical rotation)
		gameSettings.defaultCameraDistance, // Radius (distance from the target)
		undefined, // Target (initialized later)
		scene
	);
	player.camera.attachControl(canvas, true); // Attach camera controls to the canvas
	player.camera.wheelPrecision = 150; // How much each scrollwheel scroll zooms the camera in/out
	player.camera.lowerRadiusLimit = 0.1; // How close can the camera come to player
	player.camera.upperRadiusLimit = 10; // How far can the camera go from the player
	player.camera.minZ = 0.001; // Distance before camera starts to hide surfaces that are too close
	//player.camera.checkCollisions = true; // Moves camera closer if being obscured by geometry
}

//==================//
// LIGHTING HELPERS //
//==================//
/**
 * @todo fill this out
 * @param mesh
 * @param includeDescendants
 */
export function addMeshToShadowGens(mesh, includeDescendants=false){
	if(!mesh || game.shadowGenerators.length === 0) return; // if mesh is undefined or no shadowGenerators exist, return
	if(gameSettings.debugMode) console.log("Adding mesh '", mesh.name, "' to shadowGenerators: ", game.shadowGenerators);
	for(let i in game.shadowGenerators) game.shadowGenerators[i].addShadowCaster(mesh, includeDescendants);
}
/**
 * @todo fill this out
 */
export function createShadowGenerator(light, mapSize = 1024, darkness = 0.5, useBlurExpShadowMap = false, blurScale = 2, blurBoxOffset = 1, ) {
	let shadowGenerator = new BABYLON.ShadowGenerator(mapSize, light);
	shadowGenerator.useBlurExponentialShadowMap = useBlurExpShadowMap; // Enable blur exponential shadow map
	shadowGenerator.usePoissonSampling = !useBlurExpShadowMap; // Alternative to exponential shadows
	shadowGenerator.depthScale = 0.1;
	shadowGenerator.darkness = darkness; // Set shadow intensity
	shadowGenerator.blurScale = blurScale; // Set blur scaling
	shadowGenerator.blurBoxOffset = blurBoxOffset; // Blur box offset
	return shadowGenerator;
}
export function createPointLight(name, position=vec3(), intensity=1, color=newHexColor("#ffffff")){
	const pointLight = new BABYLON.PointLight(name, position, scene);
	pointLight.intensity = intensity;
	pointLight.diffuse = color;
	game.lights.push(pointLight);
	return pointLight;
}
export function createDirectionalLight(name, angles=vec3(), position=vec3(), intensity=1, color=newHexColor("#ffffff")){
	const directionalLight = new BABYLON.DirectionalLight(name, angles, scene);
	directionalLight.position = position;
	directionalLight.intensity = intensity;
	directionalLight.diffuse = color;
	game.lights.push(directionalLight);
	return directionalLight;
}
export function createSpotLight(name, angles=vec3(), position=vec3(), angleRad=0, exponent=1, intensity=1, color=newHexColor("#ffffff")){
	const spotLight = new BABYLON.SpotLight(name, position, angles, angleRad, exponent, scene);
	spotLight.intensity = intensity;
	spotLight.diffuse = color;
	game.lights.push(spotLight);
	return spotLight;
}
export function createHemisphereLight(name, angles=vec3(), position=vec3(), intensity=1, color=newHexColor("#ffffff")){
	const hemiLight = new BABYLON.HemisphericLight(name, angles, scene);
	hemiLight.position = position;
	hemiLight.intensity = intensity;
	hemiLight.diffuse = color;
	game.lights.push(hemiLight);
	return hemiLight;
}
export function initDefaultLighting(){
	// Create main light source (sun)
	let sunLight = createDirectionalLight("sun", vec3(-1.5, -1.5, -Math.PI/2), vec3(20, 50, 20));
	sunLight.intensity = 0.9;
	sunLight.shadowMaxZ = 1000; // Necessary
	// Create & set ambient lighting with tiny intensity level (just so shadowed areas aren't 100% black)
	let ambientLight = createHemisphereLight("ambient");
	ambientLight.intensity = 0.025;
	// Create & init shadowGenerator for our single directional light (sunLight)
	let sunLightShadow = new BABYLON.ShadowGenerator(1024 * 4, sunLight);
	sunLightShadow.useContactHardeningShadow = true;
	sunLightShadow.darkness = 0.25; // Lower value = darker shadows (counter-intuitive)
	// Adjust biases to reduce shadow artifacts (light bleeding or acne)
	sunLightShadow.bias = 0.0002;
	sunLightShadow.normalBias = 0.0001;
	game.shadowGenerators.push(sunLightShadow);
}

//==================//
// MATERIAL HELPERS //
//==================//
/**
 * @description Returns a string containing a random hex color in string format, e.g. `#32afb9`
 * @returns {string}
 */
export function getRandomColor() {
	let letters = '0123456789ABCDEF', color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
/**
 * @description returns a new `BABYLON.Color3` color via provided hex color code in "#123abc" format, hashtag included.
 * @param {string} color Converts hex color into `Babylon.Color3` color
 * @returns {BABYLON.Color3}
 */
export function newHexColor(color = "#FF00FF") {
	return new BABYLON.Color3.FromHexString(color);
}
/**
 * @description Creates a new `BABYLON.StandardMaterial` and applies it to the specified `mesh`, with specified `diffuseCol` and the rest optional
 * @param {string} name - Desired diffuse color for matieral
 * @param {BABYLON.Color3} diffuseCol - Desired diffuse color for matieral
 * @param {BABYLON.Color3} specularCol - Desired specularCol color for matieral (optional)
 * @param {BABYLON.Color3} emissiveCol - Desired emissiveCol color for matieral (optional)
 * @param {BABYLON.Color3} ambientCol - Desired ambientCol color for matieral (optional)
 */
export function createMat(name, diffuseCol, specularCol = BABYLON.Color3.Black(), emissiveCol = BABYLON.Color3.Black(), ambientCol = BABYLON.Color3.Black()) {
	let myMaterial = new BABYLON.StandardMaterial(name, scene);
	myMaterial.diffuseColor = diffuseCol;
	myMaterial.specularColor = specularCol;
	myMaterial.emissiveColor = emissiveCol;
	myMaterial.ambientColor = ambientCol;
	return myMaterial;
}

//============//
// UI HELPERS //
//============//
/* soon...? */

//==============//
// MESH HELPERS //
//==============//
/**
 * @description Teleports `mesh` to `pos` and keeps the velocity if `keepVelocity` is true
 * @param {BABYLON.Mesh} mesh - Desired `BABYLON.Mesh` to teleport
 * @param {BABYLON.Vector3} pos - Desired `BABYLON.Vector3` position to teleport mesh to
 * @param {boolean} keepVelocity - Keep mesh movement/rotation after teleportation?
 */
export function teleportMesh(mesh, pos, keepVelocity = false) {
	mesh.position = pos;
	// Stops ALL mesh velocity/rotation if !keepVelocity
	if (!keepVelocity && mesh.physicsImpostor) {
		mesh.physicsImpostor.setLinearVelocity(vec3(0, 0, 0));
		mesh.physicsImpostor.setAngularVelocity(vec3(0, 0, 0));
	}
}
/**
 * @description Teleports specifically the `player.body` mesh to `pos` and keeps the velocity if `keepVelocity` is true
 * @description (NOTE: This is mostly just used as a shorthand for `teleportMesh(player.body, pos, keepVelocity);` )
 * @param {BABYLON.Vector3} pos - Desired `BABYLON.Vector3` position to teleport mesh to
 * @param {boolean} keepVelocity - `Boolean` to determine if mesh should keep movement/rotation after teleportation
 */
export function teleportPlayer(pos, keepVelocity = true) {teleportMesh(player.body, pos, keepVelocity)}
/**
 * @description Generates a box with desired `dimensions`, `color`, and desired `name` at desired `position` with `mass` and `friction` being optional.
 * @param {string} name Desired mesh name (must be unique to avoid scene mesh conflicts)
 * @param {BABYLON.Vector3} dimensions `Vector3` Desired dimensions
 * @param {BABYLON.Vector3} position `Vector3` Desired position
 * @param material Desired material to apply to mesh(es). Can be `undefined` for random color, `"#123abc"` hex color string, or a full `BABYLON.StandardMaterial` object
 * @param {number} mass Desired mass
 * @param {number} friction Desired friction
 * @todo Update this function to be more generic (add `position` variable to initialize box position, check if mesh name already exists, etc)
 */
export function generateBox(name, dimensions, position = vec3(0,0,0), material = (new BABYLON.Material("invalid",scene) || "#ff00ff"), mass = 0, friction = 0.8){
	let boxMesh = BABYLON.MeshBuilder.CreateBox(name, {width: dimensions.x, height: dimensions.y, depth: dimensions.z}, scene);
	if(typeof material === "object"){
		boxMesh.material = material;
	}else{
		let hexCol = material;
		if(material[0] === "#") hexCol = hexCol.substring(1,hexCol.length);
		boxMesh.material = createMat(name+"_mat", newHexColor("#"+hexCol));
	}
	boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: mass, friction: friction}, scene);
	boxMesh.position = position;
	boxMesh.checkCollisions = true;
	boxMesh.receiveShadows = true;
	addMeshToShadowGens(boxMesh);
	return boxMesh;
}
/**
 * @description Generates `amount` number of platforms, and gives them the specified `mass`.
 * @param {number} amount Desired `BABYLON.Vector3` position to teleport mesh to
 * @param {number} mass Desired mass for platforms (set to non-zero value to enable physics)
 * @param posOrigin
 * @param posRange Desired position[25, 5, 25]
 * @param sizeRange Desired ranges for size value, multidimensional array
 * @example
 * // Generates 50 platforms that weigh 1 mass, at origin `0,50,0` with a distance range of `25,5,25` from that origin, and size range of `0.1-5` for x/z and `0.1` on y axis
 * utils.generateRandomBoxes(50, [0,50,0], [25,5,25], [[0.1,5], [0.1,0.1], [0.1,5]], 1);
 * // Generates 10 platforms that are static, at origin `0,0,0` with a distance range of `250` from that origin, and size range of 5 for x/z and `10-100` on y axis
 * utils.generateRandomBoxes(10, undefined, [250,250,250], [[5,5], [10,100], [5,5]]);
 */
export function generateRandomBoxes(amount, posOrigin = [0,0,0], posRange = [10,10,10], sizeRange = [[0,10],[0,10],[0,10]], mass = 0){
	// Generate random platforms for testing player movement, all parented to the `parentMesh`
	const parentMesh = new BABYLON.Mesh("generateRandomBoxes", scene);
	for(let i=0; i< amount; i++){
		let randSizeX = sizeRange[0][0] + (Math.random() * (sizeRange[0][1]-sizeRange[0][0]));//
		let randSizeY = sizeRange[1][0] + (Math.random() * (sizeRange[1][1]-sizeRange[1][0]));
		let randSizeZ = sizeRange[2][0] + (Math.random() * (sizeRange[2][1]-sizeRange[2][0]));
		let curObjX = Math.random() * posRange[0], curObjY = 1 + Math.random() * posRange[1], curObjZ = Math.random() * posRange[2];
		let dimensions = vec3(randSizeX, randSizeY, randSizeZ);
		let positionOffset = vec3(posOrigin[0],posOrigin[1] + (randSizeY/2),posOrigin[2]);
		let position = vec3(positionOffset.x + curObjX - (posRange[0]/2), positionOffset.y + curObjY - (posRange[1]/2), positionOffset.z + curObjZ - (posRange[2]/2));
		let randBox = generateBox("platform_"+i, dimensions, position, getRandomColor(), mass, 0.9);
		randBox.parent = parentMesh;
	}
}
/** @todo update this */
export function deleteMeshesByName(nameToDelete) {
	const meshesToDelete = scene.meshes.filter(mesh => mesh.name === nameToDelete);
	meshesToDelete.forEach(mesh => {
		if (mesh.getChildren()) {
			// Dispose of children meshes first
			mesh.getChildren().forEach(child => child.dispose());
		}
		mesh.dispose();// Dispose of the parent mesh itself
	});
}
/** @todo update this */
export function getPlayerDownDirection() {
	// Ensure the player's rotation quaternion exists
	let rotationQuaternion = player.body.rotationQuaternion || BABYLON.Quaternion.Identity();

	// Create a transformation matrix from the quaternion
	const transformMatrix = BABYLON.Matrix.Identity(); // Initialize an identity matrix
	BABYLON.Matrix.FromQuaternionToRef(rotationQuaternion, transformMatrix); // Fill it with quaternion data

	// Transform the local down direction to world space using the matrix
	let result = BABYLON.Vector3.TransformNormal(vec.down, transformMatrix).normalize();
	player.curDownVector = result;
	return result;
}
/** @todo update this */
export function checkCanJump(rayLength){
	let playerDownDirection = getPlayerDownDirection();
	return rayCast(player.body, playerDownDirection, rayLength);
}
/** @todo update this */
export function createMeshEvent(collisionMesh, onEnterOrExit, detectMesh, desiredFunc){
	const onExit = (onEnterOrExit==="exit"||onEnterOrExit==="onExit"); // Specify `onExit` conditions so everything else defaults to `onEnter`
	let newAction = new BABYLON.ExecuteCodeAction({
		trigger: onExit?13:12, // `ActionManager.OnIntersectionEnterTrigger` & `ExitTrigger` = 12 & 13 respectively
		parameter: {mesh: detectMesh,usePreciseIntersection: true}
	},desiredFunc);
	collisionMesh.actionManager = new BABYLON.ActionManager(scene);
	collisionMesh.actionManager.registerAction(newAction);
	//return collisionMesh.actionManager; // Return the actionManager object (optional/unnecessary?)
}

//===============//
// DEBUG HELPERS //
//===============//
let fixedLine, velocityLine;
/**
 * @description Draws an ingame 3-axis helper at 0,0,0 which is then scaled by the `size` specified.
 * @param {number} size Determines the size of axisHelper created
 * @param {BABYLON.Vector3} offset Defines where to position the axisHelper
 */
export function showAxisHelper(size = 1, offset = vec3(0,0,0)) {
	let axisHelperMesh = new BABYLON.Mesh("debug_axisHelper");
	let makeTextPlane = (text, color, size) => {
		let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
		let plane = BABYLON.MeshBuilder.CreatePlane("TextPlane", {size: size}, scene);
		plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
		plane.material.backFaceCulling = false;
		plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
		plane.material.diffuseTexture = dynamicTexture;
		plane.checkCollisions = false;
		plane.parent = axisHelperMesh;
		return plane;
	};
	const createAxis = (name, points, color, label, labelPos, labelColor) => {
		let axis = BABYLON.MeshBuilder.CreateLines(name, {points}, scene);
		axis.color = color;
		axis.checkCollisions = false;
		axis.parent = axisHelperMesh;
		let char = makeTextPlane(label, labelColor, size / 10);
		char.position = labelPos;
		return axis;
	};
	createAxis("axisX", [
		vec3(0,0,0),
		vec3(size, 0, 0),
		vec3(size * 0.95, 0.05 * size, 0),
		vec3(size, 0, 0),
		vec3(size * 0.95, -0.05 * size, 0)
	], new BABYLON.Color3(1, 0, 0), "X", vec3(0.9 * size, 0.05 * size, 0), "red");
	createAxis("axisY", [
		vec3(0,0,0),
		vec3(0, size, 0),
		vec3(-0.05 * size, size * 0.95, 0),
		vec3(0, size, 0),
		vec3(0.05 * size, size * 0.95, 0)
	], new BABYLON.Color3(0, 1, 0), "Y", vec3(0, 0.9 * size, -0.05 * size), "green");
	createAxis("axisZ", [
		vec3(0,0,0),
		vec3(0, 0, size),
		vec3(0, -0.05 * size, size * 0.95),
		vec3(0, 0, size),
		vec3(0, 0.05 * size, size * 0.95)
	], new BABYLON.Color3(0, 0, 1), "Z", vec3(0, 0.05 * size, 0.9 * size), "blue");
	axisHelperMesh.position = offset;
	axisHelperMesh.checkCollisions = false;
}
/** @todo update this */
export function getSurfaceNormal(mesh, rayLength = 1, relativeToPlayer = true) {
	// Perform the raycast to detect the mesh below the player

	const hit = rayCast(mesh, relativeToPlayer = vec.down, rayLength);//scene.pickWithRay(downwardRay);


	// Check if a mesh was hit
	if (hit && hit.hit) {
		//const pickedMesh = hit.pickedMesh;
		const normal = hit.getNormal(true, false); // Get the normal vector at the hit point
		//console.log("normal:",  normal, "pickedMesh.name:", pickedMesh.name);
		if(relativeToPlayer !== vec.down){
			const normalizedDirection = player.movementDirection.normalize();
			// Calculate desired Y-axis angle from `desiredMovement`, quantize to 45 deg
			let angle = Math.atan2(normalizedDirection.x, normalizedDirection.z);
			const quantizedYAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
			const surfaceRotation = BABYLON.Quaternion.FromLookDirectionLH(
				BABYLON.Vector3.Cross(vec.right.scale(-1), normal), // Compute look direction
				normal
			);
			surfaceRotation.multiply(getPlayerDownDirection().toQuaternion());
			return surfaceRotation.toEulerAngles();
		}
		//console.log("normal",normal);
		if (normal) return normal; // If normal is not undefined, return the normal vector
	}
	return vec.up; // No hit detected, return absolute up vector
}
/** @todo update this */
export function clampVector3ToMaxLength(vector, maxLength) {
	const length = vector.length(); // Get the magnitude of the vector
	if (length > maxLength) {
		return vector.scale(maxLength / length); // Scale down to the maximum length
	}
	return vector; // Return as-is if it's already within the limit
}
/** @todo update this */
export function getVecDifInDegrees(vec1, vec2){
	return BABYLON.Tools.ToDegrees(Math.acos(BABYLON.Vector3.Dot(vec1.normalize(), vec2.normalize())))
}
/** @todo update this */
export function getHorizontalSpeedFromVec(moveVector) {return Math.sqrt(moveVector.x ** 2 + moveVector.z ** 2);}
/**
 * @todo UNTESTED FUNCTION, also update this
 */
export function createTrajectoryLines(mesh) {
	fixedLine = BABYLON.MeshBuilder.CreateLines("fixedLine", {
		points: [
			mesh.position,
			mesh.position.add(mesh.forward.scale(3))
		],
		updatable: true
	}, scene);
	fixedLine.color = new BABYLON.Color3(0.5, 0.5, 0.5); // gray

	velocityLine = BABYLON.MeshBuilder.CreateLines("velocityLine", {
		points: [
			mesh.position,
			mesh.position.add(mesh.forward)
		],
		updatable: true
	}, scene);
	velocityLine.color = new BABYLON.Color3(0, 1, 0); // pure green

	scene.onBeforeRenderObservable.add(() => {
		const velocity = mesh.physicsImpostor?.getLinearVelocity();
		if (!velocity) return;

		const direction = mesh.forward;

		// Update fixed direction line
		fixedLine.dispose();
		const fixedEnd = mesh.position.add(direction.scale(3));
		fixedLine = BABYLON.MeshBuilder.CreateLines("fixedLine", {
			points: [mesh.position, fixedEnd],
			updatable: true
		}, scene);
		fixedLine.color = new BABYLON.Color3(0.5, 0.5, 0.5);

		// Update velocity-based line
		velocityLine.dispose();
		const velocityEnd = mesh.position.add(velocity);
		velocityLine = BABYLON.MeshBuilder.CreateLines("velocityLine", {
			points: [mesh.position, velocityEnd],
			updatable: true
		}, scene);
		velocityLine.color = new BABYLON.Color3(0, 1, 0);
	});

	return {
		dispose: () => {
			fixedLine.dispose();
			velocityLine.dispose();
		}
	};
}

/**
 * JSDoc parameter usage example
 *
 * @description Takes `size` of rectangle and returns the calculated area as a `string`.
 * @param {object} size - The width of the rectangle.
 * @param {boolean} round - Should the output be rounded to the nearest decimal place
 * @returns {string} The calculated area with units.
 * @throws {Error} Throws an error if width or height is negative.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript
 * @example
 * // Basic usage:
 * calculateArea(5, 10); // "50 sq.units"
 * @example
 * // Basic usage #2:
 * calculateArea(5.11, 10.52, true); // "54 sq.units", rounds the number if decimals present
 */
function calculateArea(size, round){
	return round?Math.round(size.x * size.y)+"":size.x * size.y;
}
