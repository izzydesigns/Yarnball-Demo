import {engine, game, player, scene} from "./main.js";
import * as input from "./input.js";

//===================================//
// SCENE HELPERS/SHORTHAND VARIABLES //
//===================================//
/**
 * @description Pauses the game using `engine.stopRenderLoop()`, and sets `scene.animationsEnabled` to `false` to pause animations.
 * @see https://doc.babylonjs.com/typedoc/classes/BABYLON.Engine#stoprenderloop Babylon API documentation.
 */
export function pauseScene() {
	engine.stopRenderLoop(); // Pause game's render loop
	scene.animationsEnabled = false; // Temporarily disables animations
	console.log("Window/tab has been minimized, scene should pause...");
}
/**
 * @description Resumes the game using `engine.runRenderLoop(() => scene.render());`, and sets `scene.animationsEnabled` to `true` to resume animations.
 * @see https://doc.babylonjs.com/typedoc/classes/BABYLON.Engine#runrenderloop Babylon API documentation.
 */
export function resumeScene() {
	engine.runRenderLoop(() => scene.render()); // Resume rendering
	scene.animationsEnabled = true; // Resumes scene animations
	console.log("Window/tab is visible again! Resume the scene.");
}
/**
 * @description Raycasting helper function, specify a `mesh`, `rayDirection`, and `rayLength`, while optionally specifying more `excludedMeshes` to ignore during raycast.
 * @param {BABYLON.Mesh} mesh Which mesh to raycast from (mesh's origin is used for ray origin)
 * @param {BABYLON.Vector3} rayDirection Which direction to raycast from
 * @param {number} rayLength How far (in scene units) to cast ray
 * @param {array} excludedMeshes (Optional) Extra mesh objects to exclude from raycast
 * @returns {boolean} Returns true if `ray.hit` detects a mesh not present in it's `excludedMeshes` (Ray casting done using `scene.pickWithRay()`)
 * @see https://doc.babylonjs.com/typedoc/functions/BABYLON.PickWithRay Babylon API documentation.
 */
export function rayCast(mesh, rayDirection, rayLength, excludedMeshes = []){
	const ray = new BABYLON.Ray(
		mesh.position.clone(),// Center of player mesh
		rayDirection,
		rayLength
	);
	// Exclude player meshes from rayCast() if the `mesh` is the player's mesh
	if(mesh === player.body || mesh === scene.getMeshByName("playerMesh")) excludedMeshes.push(player.body, scene.getMeshByName("playerMesh"));
	const predicate = (mesh) => !excludedMeshes.includes(mesh);
	const raycast = scene.pickWithRay(ray, predicate);
	return raycast.hit; // Return final hit result of ray
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
 * @description Creates a new `BABYLON.StandardMaterial` and applies it to the specified `mesh`, with
 * @param {BABYLON.Mesh} mesh - Desired `BABYLON.Mesh` to apply the new material to
 * @param {BABYLON.Color3} diffuseCol - Desired diffuse color for matieral
 * @param {BABYLON.Color3} specularCol - Desired specularCol color for matieral (optional)
 * @param {BABYLON.Color3} emissiveCol - Desired emissiveCol color for matieral (optional)
 * @param {BABYLON.Color3} ambientCol - Desired ambientCol color for matieral (optional)
 */
export function createMat(mesh, diffuseCol, specularCol = undefined, emissiveCol = undefined, ambientCol = undefined) {
	let myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
	myMaterial.diffuseColor = diffuseCol;
	if (specularCol)myMaterial.specularColor = specularCol;
	if (emissiveCol)myMaterial.emissiveColor = emissiveCol;
	if (ambientCol)myMaterial.ambientColor = ambientCol;
	mesh.material = myMaterial;
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
		mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
		mesh.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
	}
}
/**
 * @description Teleports specifically the `player.body` mesh to `pos` and keeps the velocity if `keepVelocity` is true
 * @description (NOTE: This is mostly just used as a shorthand for `teleportMesh(player.body, pos, keepVelocity);` )
 * @param {BABYLON.Vector3} pos - Desired `BABYLON.Vector3` position to teleport mesh to
 * @param {boolean} keepVelocity - `Boolean` to determine if mesh should keep movement/rotation after teleportation
 */
export function teleportPlayer(pos, keepVelocity) {teleportMesh(player.body, pos, keepVelocity)}
/**
 * @description Generates `amount` number of platforms, and gives them the specified `mass`.
 * @param {number} amount - Desired `BABYLON.Vector3` position to teleport mesh to
 * @param {number} mass - Desired mass for platforms (set to non-zero value to enable physics)
 */
export function generateRandomPlatforms(amount, mass){
	// Generate random platforms for testing player movement
	let objPosRange = [25, 5, 25], objSizeRange = [[0.1, 5], [0.1, 0.1], [0.1, 5]];
	for(let i=0; i< amount; i++){
		let curObstCol = newHexColor(getRandomColor());
		let randSizeX = objSizeRange[0][0] + (Math.random() * (objSizeRange[0][1]-objSizeRange[0][0]));
		let randSizeY = objSizeRange[1][0] + (Math.random() * (objSizeRange[1][1]-objSizeRange[1][0]));
		let randSizeZ = objSizeRange[2][0] + (Math.random() * (objSizeRange[2][1]-objSizeRange[2][0]));
		let curObst = BABYLON.MeshBuilder.CreateBox("obst_"+i, {width: randSizeX, height: randSizeY, depth: randSizeZ}, scene);
		let curObx = Math.random() * objPosRange[0], curOby = 1 + Math.random() * objPosRange[1], curObz = Math.random() * objPosRange[2];
		curObst.physicsImpostor = new BABYLON.PhysicsImpostor(curObst, BABYLON.PhysicsImpostor.BoxImpostor, {mass: mass, friction: 0.75, restitution: 0.3}, scene);
		curObst.position = new BABYLON.Vector3(curObx - (objPosRange[0]/2), curOby, curObz - (objPosRange[2]/2));
		createMat(curObst, curObstCol);
	}
}
/**
 * @description Generates a box with desired `dimensions`, `color`, and arbitrarily chosen `name`
 * @param {string} name `String` Desired ground mesh name (must be unique to avoid scene mesh conflicts)
 * @param {BABYLON.Vector3} dimensions `Vector3` Desired ground dimensions
 * @param {string} color `String` hex code (in `"#abc123"` format)
 * @todo Update this function to be more generic (add `position` variable to initialize box position, check if mesh name already exists, etc)
 */
export function generateBox(name, dimensions, color){
	let groundMesh = BABYLON.MeshBuilder.CreateBox(name, {width: dimensions.x, height: dimensions.y, depth: dimensions.z}, scene);
	let groundMat = new BABYLON.StandardMaterial(name+"_material", scene);
	groundMat.diffuseColor = BABYLON.Color3.FromHexString(color);
	groundMesh.material = groundMat;groundMesh.checkCollisions = true;
	groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(groundMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, friction: 0.5, restitution: 0}, scene);
}

//===============//
// DEBUG HELPERS //
//===============//
/**
 * @description Draws an ingame 3-axis helper at 0,0,0 which is then scaled by the `size` specified.
 * @param {number} size - `number` used to determine size of axisHelper created
 */
export function showAxisHelper(size = 1) {
	let makeTextPlane = (text, color, size) => {
		let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
		let plane = BABYLON.MeshBuilder.CreatePlane("TextPlane", {size: size}, scene);
		plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
		plane.material.backFaceCulling = false;
		plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
		plane.material.diffuseTexture = dynamicTexture;
		return plane;
	};
	const createAxis = (name, points, color, label, labelPos, labelColor) => {
		let axis = BABYLON.MeshBuilder.CreateLines(name, {points}, scene);
		axis.color = color;
		let char = makeTextPlane(label, labelColor, size / 10);
		char.position = labelPos;
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

// Public game variables for UI stat usage later on...
export let gameObj = game;
export let playerObj = player;
export let sceneObj = scene;
export let engineObj = engine;
export let inputObj = input;

/**
 * This is just an example of JSDoc parameter usage (w/ example function) for my own personal uses ^_^
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