var vZero = BABYLON.Vector3.Zero();

var rotateVec2 = function(v, q){
	var matrix = new BABYLON.Matrix();
	q.toRotationMatrix(matrix);
	var rotatedvect = BABYLON.Vector2.Transform(v, matrix);
	return rotatedvect;
};
var clampRadian = function(radianValue) {
	var cyclesNumber;
	if (radianValue < (-2 * Math.PI) || radianValue > (2 * Math.PI)) {
		if (radianValue >= 0) {
			cyclesNumber = Math.floor(radianValue / (2 * Math.PI));
		} else {
			cyclesNumber = Math.ceil(radianValue / (2 * Math.PI));
		}
		radianValue = radianValue - (cyclesNumber * (2 * Math.PI));
	}
	return radianValue;
};
var clampVector = function(vector3) {
	return BABYLON.Vector3.FromArray([
		clampRadian(vector3.x),
		clampRadian(vector3.y),
		clampRadian(vector3.z),
	]);
};
function getRandomColor() {var letters = '0123456789ABCDEF', color = '#';for (var i = 0; i < 6; i++) {color += letters[Math.floor(Math.random() * 16)];}return color;}
