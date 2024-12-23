// Math helpers
/* @description A shorthand for BABYLON.Vector3.Zero(). */
export let v0 = BABYLON.Vector3.Zero();
let vec = function (x, y, z) {
	return new BABYLON.Vector3(x, y, z);
}
let rotateVec2 = function (v, q) {
	let matrix = new BABYLON.Matrix();
	q.toRotationMatrix(matrix);
	return BABYLON.Vector2.Transform(v, matrix);
}
let clampRadian = function (radianValue) {
	let cyclesNumber;
	if (radianValue < (-2 * Math.PI) || radianValue > (2 * Math.PI)) {
		if (radianValue >= 0) {
			cyclesNumber = Math.floor(radianValue / (2 * Math.PI));
		} else {
			cyclesNumber = Math.ceil(radianValue / (2 * Math.PI));
		}
		radianValue = radianValue - (cyclesNumber * (2 * Math.PI));
	}
	return radianValue;
}
let clampVector = function (vector3) {
	return BABYLON.Vector3.FromArray([
		clampRadian(vector3.x),
		clampRadian(vector3.y),
		clampRadian(vector3.z),
	]);
}

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
// TODO: rewrite animation system in a better way (using player.animationState?)
// Base animations off of player.movement variables
// Blend specific animation transitions quicker/slower than others as necessary
/* @description Plays a specific animation group by name */
export const playAnimation = (name, scene) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group) {
		group.start(true); // Loop animations
		console.log(`▶️ Animation: ${name}`);
	} else {console.warn(`Animation group "${name}" not found.`);}
};
/* @description Stops a specific animation group by name */
export const stopAnimation = (name, scene) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group && group.isPlaying) {
		group.stop();
		if(debugMode)console.log(`🟥 Animation: ${name}`);
	} else {console.warn(`Animation group "${name}" not found/not playing.`);}
};
/* @description Stops an animation after it completes */
export const stopAnimAfterDone = (name, scene) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group && group.isPlaying) {// Wait until the animation ends, then stop it
		group.onAnimationEndObservable.addOnce(() => {
			group.stop();if(debugMode)console.log(`🟥 Animation (completed): ${name}`);
		});
	} else {console.warn(`Animation group "${name}" not found/not playing.`);}
};
/* @description Stops all animations for a specified mesh */
export const stopAllAnimationsForMesh = (mesh, scene) => {
	scene.animationGroups.forEach((group) => {
		if (group.targetedAnimations.some((ta) => ta.target === mesh)) {
			group.stop();if(debugMode)console.log(`🟥 Animation group: ${group.name}`);
		}
	});
};
/* @description Check if a specific animation group is currently playing */
export const isAnimationPlaying = (name, scene) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	if (group) {
		if(debugMode)console.log(`${name} is ${group.isPlaying ? "▶️ playing" : "🟥 not playing"}`);
		return group.isPlaying;
	} else {
		console.warn(`Animation group "${name}" not found.`);
		return false;
	}
};
let lastAnim = '';
/* @description Animation handler, stops previous animation and plays requested one (if available) */
/*export const playAnimation = (name, scene) => {
	const group = scene.animationGroups.find((g) => g.name === name);
	const lastGroup = scene.animationGroups.find((g) => g.name === lastAnim);
	if (group) {
		if(lastGroup) {
			lastGroup.stop();
			if(debugMode)console.log(`🟥 Animation: ${lastGroup}`);
		}
		group.start(true); // Loop animations
		if(debugMode)console.log(`▶️ Animation: ${name}`);
	} else {console.warn(`Animation group "${name}" not found.`);}
	if(name.length > 0){lastAnim = name;}
};*/

// Mesh helpers
/* @description Teleports 'mesh' to 'pos', and if 'keepVelocity' is specified, it will preserve it's velocity after teleporting */
export function teleportMesh(pos, mesh, keepVelocity) {
	mesh.position = pos;
	if (!keepVelocity) {
		mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
		mesh.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
	}
}
export function checkCanJump(player, scene) {
	const rayOrigin = player.body.position.clone(); // Center of player mesh
	const rayDirection = BABYLON.Vector3.Down(); // Ray pointing downward
	const rayLength = 0.5; // Half the player's height (adjust as needed)

	const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);
	const hit = scene.pickWithRay(ray);

	// Update player movement booleans based on when the player is touching the ground
	if (hit.pickedMesh) {
		//TODO: Fix this logic stuff to determine onGround = true, not all this
		//console.log("colliding?");
		if(!player.movement.canMove)player.movement.canMove = true;
		if(!player.movement.canJump)player.movement.canJump = true;
		if(player.movement.jumping)player.movement.jumping = false;
	} else {
		player.movement.canMove = false;
		player.movement.canJump = false;
		player.movement.isMoving = true;
		//console.log("in the air???", player.movement.canMove);
	}
}

// DEBUG helpers
export function showAxisHelper(size, scene) {
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
export let debugMode = true;
