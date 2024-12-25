import {game, player, scene} from "./main.js";

// Helper/shorthand variables


// Material helpers
export function getRandomColor() {
	let letters = '0123456789ABCDEF', color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
export function newColor(color) {
	return new BABYLON.Color3.FromHexString(color);
}
export function createMat(mesh, diffuseCol, specularCol, emissiveCol, ambientCol) {
	let myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
	myMaterial.diffuseColor = diffuseCol;
	if (specularCol !== undefined) {
		myMaterial.specularColor = specularCol;
	}
	if (emissiveCol !== undefined) {
		myMaterial.emissiveColor = emissiveCol;
	}
	if (ambientCol !== undefined) {
		myMaterial.ambientColor = ambientCol;
	}
	mesh.material = myMaterial;
}

// Animation helpers
// TODO: Put animation functions here? or somewhere else?
export function playAnimation(animName, animSpeed=1){
	let curAnimState = player.curAnimation;
	if(animName !== curAnimState){
		//stop player.curAnimation animation
		//play animName animation at animSpeed
	}else{
		//can't play the same animation twice
		//unless re-starting animation cycle...
		//must be done smoothly tho?
	}
}

// Mesh helpers
/* @description Teleports 'mesh' to 'pos', and if 'keepVelocity' is specified, it will preserve it's velocity after teleporting */
export function teleportMesh(pos, mesh, keepVelocity) {
	mesh.position = pos;
	if (!keepVelocity && mesh.physicsImpostor) {
		mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
		mesh.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
	}
}
export function teleportPlayer(pos, keepVelocity) {
	player.mesh.position = pos;
	player.body.position = pos;
	if (!keepVelocity) {
		player.body.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
		player.body.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
	}
}
/* @description Casts ray below player and sets player 'canMove', 'canJump', and 'onGround' = true if hit detected */
export function checkCanJump() {
	// TODO: Improve this function in order to allow traversal of sloped surfaces
	const ray = new BABYLON.Ray(
		player.body.position.clone(),// Center of player mesh
		BABYLON.Vector3.Down(),// Ray pointing downward
		(0.2 + 0.02),// Half the player's height (adjust as needed) plus tiny buffer for slopes
	);
	const excludedMeshes = [player.body,scene.getMeshByName("catGeo") /* TODO: REPLACE THIS (tied to 3d model mesh name???) */];
	const predicate = (mesh) => !excludedMeshes.includes(mesh);
	const hit = scene.pickWithRay(ray, predicate);

	// Update player movement booleans based on when the player is touching the ground
	if (hit.hit) {
		player.movement.canMove = true;
		player.movement.canJump = true;
		player.movement.onGround = true;
		if(game.debugMode)console.log("Ray hit mesh:", hit.pickedMesh.name);
	} else {
		player.movement.canMove = false;
		player.movement.canJump = false;
		player.movement.onGround = false;
		if(game.debugMode)console.log("Ray did not hit any meshes");
	}
}

// DEBUG helpers
export function showAxisHelper(size) {
	let makeTextPlane = (text, color, size) => {
		let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
		let plane = new BABYLON.MeshBuilder.CreatePlane("TextPlane", {size}, scene);
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
