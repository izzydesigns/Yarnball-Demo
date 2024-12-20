let vZero = BABYLON.Vector3.Zero();
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

function getRandomColor() {
	let letters = '0123456789ABCDEF', color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
function newColor(color) {
	return new BABYLON.Color3.FromHexString(color);
}
function createMat(mesh, diffuseCol, specularCol, emissiveCol, ambientCol) {
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
	], new BABYLON.Color3(1, 0, 0), "X", new BABYLON.Vector3(0.9 * size, -0.05 * size, 0), "red");
	createAxis("axisY", [
		new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
		new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
	], new BABYLON.Color3(0, 1, 0), "Y", new BABYLON.Vector3(0, 0.9 * size, -0.05 * size), "green");
	createAxis("axisZ", [
		new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
		new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
	], new BABYLON.Color3(0, 0, 1), "Z", new BABYLON.Vector3(0, 0.05 * size, 0.9 * size), "blue");
}
function teleportMesh(pos, mesh, keepVelocity) {
	mesh.position = pos;
	if (!keepVelocity) {
		mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
		mesh.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
	}
}
