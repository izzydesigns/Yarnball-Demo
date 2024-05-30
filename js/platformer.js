var canvas = $("#renderCanvas").get(0);
var engine = new BABYLON.Engine(canvas, true);
var scene = new BABYLON.Scene(engine);
var shadowGenerator;

//initialize game variables
var game = {
	outline: {
		enabled: true,
		width: 0.1,
		color: BABYLON.Color3.Black(),
	},
	debugMode: true,
};
//initialize player variable
var velo = [BABYLON.vZero, BABYLON.vZero];
var player = {
	body: BABYLON.Mesh.CreateSphere("playerSphere", 3, 5, scene),
	camera: new BABYLON.ArcRotateCamera("Camera", 0, 0, 50, null, scene),
	Lcam: undefined, Rcam: undefined,
	moveSpeed: 250,//speed to add every frame while key held
	jumpHeight: 200,
	maxVelocity: 500,
	angDamping: 0.65,
	linDamping: 0.65,
	movement: {
		forward: false,
		back: false,
		left: false,
		right: false,
		jumping: false,
	},
	velocity: undefined,
};

//variables
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
var addMaterial = function(mesh, diffuseCol, specularCol, emissiveCol, ambientCol){
	var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
	myMaterial.diffuseColor = diffuseCol;
	if(specularCol !== undefined){
		myMaterial.specularColor = specularCol;
	}
	if(emissiveCol !== undefined){
		myMaterial.emissiveColor = emissiveCol;
	}
	if(ambientCol !== undefined){
		myMaterial.ambientColor = ambientCol;
	}
	mesh.material = myMaterial;
};
var newColor = function(color){return new BABYLON.Color3.FromHexString(color);};
var teleportTo = function(pos, mesh){
	mesh.position = pos;
	mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,0,0));
	mesh.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0,0,0));
};
var pushPlayer = function(player, directionVec, forceAmt){
	player.body.physicsImpostor.applyForce(forward.scale(player.moveSpeed*diminishSpeed).scale(leftOrRight?diagonalDampening:1), player.body.getAbsolutePosition());
};

//Game/scene init functions
var renderLights = function(){
	//spawn light inside scene
	var light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0,-1,0), scene);
	light.position = new BABYLON.Vector3(200, 500, 100);
	light.intensity = 0.25;
	light.range = 10000;
	
	var light2 = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
	light2.intensity = 0.25;

	//enable shadows
	//doc.babylonjs.com/features/featuresDeepDive/lights/shadows
	shadowGenerator = new BABYLON.ShadowGenerator(1024*4, light);
	//shadowGenerator.usePoissonSampling = true;
	//shadowGenerator.useExponentialShadowMap = true;
	shadowGenerator.useBlurExponentialShadowMap = true;
	shadowGenerator.blurScale = 1;//default 2
	shadowGenerator.blurBoxOffset = 1;//default 1, -1 to 1
	/*shadowGenerator.useKernelBlur = true;
	shadowGenerator.blurKernel = 1;//default 1*/
	//shadowGenerator.useCloseExponentialShadowMap = true;
	//shadowGenerator.useBlurCloseExponentialShadowMap = true;
	//shadowGenerator.usePercentageCloserFiltering = true;
	
	shadowGenerator.addShadowCaster(player.body);
};
var renderLevel = function(){

	//show velocity helper
	if(game.debug){
		player.velocity = BABYLON.MeshBuilder.CreateLines("velo", {points: velo, updatable: true});
		//draw axis helper
		var showAxis = function(size) {
			var makeTextPlane = function(text, color, size) {
				var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
				dynamicTexture.hasAlpha = true;
				dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
				var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
				plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
				plane.material.backFaceCulling = false;
				plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
				plane.material.diffuseTexture = dynamicTexture;
				return plane;
			};
			var axisX = BABYLON.Mesh.CreateLines("axisX", [ 
				new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0), 
				new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
			], scene);
			axisX.color = new BABYLON.Color3(1, 0, 0);
			var xChar = makeTextPlane("X", "red", size / 10);
			xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
			var axisY = BABYLON.Mesh.CreateLines("axisY", [
				new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0), 
				new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
			], scene);
			axisY.color = new BABYLON.Color3(0, 1, 0);
			var yChar = makeTextPlane("Y", "green", size / 10);
			yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
			var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
				new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
				new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
			], scene);
			axisZ.color = new BABYLON.Color3(0, 0, 1);
			var zChar = makeTextPlane("Z", "blue", size / 10);
			zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
		};
		showAxis(10);
	}

	//create teleport barrier
	var ground = BABYLON.MeshBuilder.CreateBox("deathzone", {width: 10000, height: 1, depth: 10000}, scene);
	ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.75, restitution: 0.3 }, scene);
	ground.position.y = -100;
	addMaterial(ground, newColor("#ff8888"));
	ground.receiveShadows = true;
	//create starting platform
	var start = BABYLON.MeshBuilder.CreateBox("startzone", {width: 5000, height: 5, depth: 5000}, scene);
	start.physicsImpostor = new BABYLON.PhysicsImpostor(start, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.75, restitution: 0.3 }, scene);
	addMaterial(start, newColor("#88ff88"));
	start.receiveShadows = true;

	
	//create random obstacles
	function getRandomColor() {var letters = '0123456789ABCDEF', color = '#';for (var i = 0; i < 6; i++) {color += letters[Math.floor(Math.random() * 16)];}return color;}
	var obstacleCount = 100, obRange = [250, 250, 250], obSizeRange = [[1,10],[1,1],[1,10]];
	for(var i=0;i<obstacleCount;i++){
		var curObstCol = newColor(getRandomColor());
		var randSizeX = obSizeRange[0][0] + (Math.random() * (obSizeRange[0][1]-obSizeRange[0][0]));
		var randSizeY = obSizeRange[1][0] + (Math.random() * (obSizeRange[1][1]-obSizeRange[1][0]));
		var randSizeZ = obSizeRange[2][0] + (Math.random() * (obSizeRange[2][1]-obSizeRange[2][0]));
		//console.log(randSizeX);
		var curObst = BABYLON.MeshBuilder.CreateBox("obst_"+i, {width: randSizeX, height: randSizeY, depth: randSizeZ}, scene);
		var curObx = Math.random() * obRange[0], curOby = Math.random() * obRange[1], curObz = Math.random() * obRange[2];
		curObst.physicsImpostor = new BABYLON.PhysicsImpostor(curObst, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.75, restitution: 0.3 }, scene);
		curObst.position = new BABYLON.Vector3(curObx - (obRange[0]/2), curOby, curObz - (obRange[2]/2));
		addMaterial(curObst, curObstCol);
		shadowGenerator.addShadowCaster(curObst);
		curObst.receiveShadows = true;
		curObst.renderOutline = game.outline.enabled;
		curObst.outlineWidth = game.outline.width;
		curObst.outlineColor = game.outline.color;
	}
	
	BABYLON.SceneLoader.ImportMesh("", "", "cat.glb", scene, function (meshes) {
		// Callback function after the mesh is loaded
		// 'meshes' will contain an array of all loaded meshes
		// You can access and manipulate the loaded mesh here
		var catMesh = meshes[0]; // Assuming the cat is the first mesh loaded
		
		// Additional operations on the cat mesh if needed
	});
};
var initializePlayer = function(spawnPos){
	player.camera.attachControl(canvas, true);
	player.camera.setTarget(player.body);
	
	player.body.physicsImpostor = new BABYLON.PhysicsImpostor(player.body, BABYLON.PhysicsImpostor.SphereImpostor,{mass: 2.5, friction: 0.5, restitution: 0.5}, scene);
	player.body.physicsImpostor.physicsBody.linearDamping = player.linDamping;
	player.body.physicsImpostor.physicsBody.angularDamping = player.angDamping;
	player.body.position.y = 30;
	addMaterial(player.body, newColor("#1896d3"));
	
	player.body.renderOutline = game.outline.enabled;
player.body.outlineWidth = game.outline.width;
player.body.outlineColor = game.outline.color;
};

//user inputs
window.addEventListener("keyup", function(e){
	if(e.key == "w" || e.key == "a" || e.key == "s" || e.key == "d"){
		if(e.key == "w"){
			player.movement.forward = false;
		}else if(e.key == "s"){
			player.movement.back = false;
		}else if(e.key == "a"){
			player.movement.left = false;
		}else if(e.key == "d"){
			player.movement.right = false;
		}
	}
	if(e.key == " "){
		player.movement.jumping = false;
	}
});
window.addEventListener("keydown", function(e){
	var curKey = e.key.toLowerCase();
	if (e.repeat) {return;}
	//console.log(typeof e.key);
	if(curKey == "w" || curKey == "a" || curKey == "s" || curKey == "d"){
		if(curKey == "w"){
			player.movement.forward = true;
		}else if(curKey == "s"){
			player.movement.back = true;
		}else if(curKey == "a"){
			player.movement.left = true;
		}else if(curKey == "d"){
			player.movement.right = true;
		}
	}
	if(e.key == "Tab"){
		game.debugMode = !game.debugMode;
		if(game.debugMode){
			scene.debugLayer.show();
			$(".debug").show();
		}
	}
	if(e.key == " "){
		player.movement.jumping = true;
		var ray = new BABYLON.Ray(player.body.position, (new BABYLON.Vector3(0,-1,0)).normalize(), 100);
		var playerSize = Math.abs(player.body.getBoundingInfo().boundingSphere.minimum.y);
		var collisionPadding = playerSize/10;//arbitrary tollerance to allow jumping on slanted surfaces better
		var hit = scene.pickWithRay(ray, function(item){
			if(item === player.body){return false;}
			return true;
		});
		//console.log(hit.distance);
		if(hit.distance <= playerSize + collisionPadding){
			//console.log("jumping!");
			var body = player.body.physicsImpostor, bodyPos = player.body.position;
			var jumpHeight = new BABYLON.Vector3(0,1,0).scale(player.jumpHeight);
			body.applyImpulse(jumpHeight,bodyPos);
		}
	}else{
		console.log(e.key);
	}
});

engine.runRenderLoop(function() {
	//teleport player when they hit a death barrier
	if(player.body.intersectsMesh(scene.getMeshByID("deathzone"))){
		teleportTo(new BABYLON.Vector3(0,30,0), player.body);
	}

	var playerSpeed = player.body.getPhysicsImpostor().getLinearVelocity();
	player.velocity = BABYLON.MeshBuilder.CreateLines("velo", {points: [velo,playerSpeed.scale(0.5)], instance: player.velocity});
	player.velocity.position = player.body.position;

	//player movement code
	if(player.movement.forward || player.movement.back || player.movement.left || player.movement.right){
		var leftOrRight = player.movement.left || player.movement.right;
		var forwardOrBack = player.movement.forward || player.movement.back;

		var playerSpeed = player.body.getPhysicsImpostor().getLinearVelocity();
		var getRawVelocity = (Math.abs(playerSpeed.x) + Math.abs(playerSpeed.z))/2;
		var clampedVelo = getRawVelocity>player.maxVelocity?player.maxVelocity:getRawVelocity;
		var diminishSpeed = ((player.maxVelocity - clampedVelo)/player.maxVelocity);
		var diagonalDampening = 0.67;

		var camXY = new BABYLON.Vector3(player.camera.position.x, 0, player.camera.position.z);
		var movementVec = new BABYLON.Vector3();

		var forward = player.body.position.subtract(camXY).normalize();

		var backwards = new BABYLON.Vector3(-forward.x, 0, -forward.z);
		console.log("forward vec", forward);
		var leftAlpha = player.camera.alpha+(Math.PI/2);
		var rightAlpha = player.camera.alpha-(Math.PI/2);
		//var LcamXY = player.body.position.subtract(BABYLON.Vector3(leftAlpha, 0, 0)).normalize();
		//var RcamXY = new BABYLON.Vector3(rightAlpha, 0, 0);
		
		
		if(player.movement.forward && !player.movement.back){
			player.body.physicsImpostor.applyForce(forward.scale(player.moveSpeed*diminishSpeed).scale(leftOrRight?diagonalDampening:1), player.body.getAbsolutePosition());
		}
		if(player.movement.back && !player.movement.forward){
			player.body.physicsImpostor.applyForce(backwards.scale(player.moveSpeed*diminishSpeed).scale(leftOrRight?diagonalDampening:1), player.body.getAbsolutePosition());
		}
		if(player.movement.left && !player.movement.right){
			//player.body.physicsImpostor.applyForce(BABYLON.Quaternion.RotationAlphaBetaGamma(forward.x).scale(player.moveSpeed*diminishSpeed).scale(forwardOrBack?diagonalDampening:1), player.body.getAbsolutePosition());
		}
		if(player.movement.right && !player.movement.left){
			//player.body.physicsImpostor.applyForce((player.body.position.subtract(RcamXY).normalize()).scale(player.moveSpeed*diminishSpeed).scale(forwardOrBack?diagonalDampening:1), player.body.getAbsolutePosition());
		}
	}

	//update UI elements
	/*var getRawVelocity = ((Math.abs(playerSpeed.x) + Math.abs(playerSpeed.z))/2).toFixed(2);
	var pX = player.body.position.x, pY = player.body.position.y, pZ = player.body.position.z;
	$(".debug .speed").text("Speed: "+getRawVelocity);
	$(".debug .pos").text("Position: "+pX.toFixed(2)+"x "+pY.toFixed(2)+"y "+pZ.toFixed(2)+"z");*/

	scene.render();
});

//viewport updating
window.addEventListener("resize", function() {engine.resize();});
canvas.addEventListener("click", function(e) {
	canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
	if(canvas.requestPointerLock){canvas.requestPointerLock();}
	if(e.button == 0){
		console.log("left clicked!");
	}else if(e.button == 2){
		console.log("right clicked!");
	}
}, false);
window.mobileAndTabletCheck = function() {
	/*taken from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser*/
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

//INITIALIZE GAME
(function(){
	scene.ambientColor = new BABYLON.Color3(0.25, 0.45, 0);
	//initialize physics environment
	var gravity = new BABYLON.Vector3(0, -100, 0);
	//scene.enablePhysics(gravity, new BABYLON.AmmoJSPlugin()); /*Uncaught TypeError: this.bjsAMMO.btSoftBodyRigidBodyCollisionConfiguration is not a constructor*/
	scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin());
	//scene.enablePhysics(gravity, new BABYLON.OimoJSPlugin());
	scene.getPhysicsEngine().setTimeStep(1/6);
	renderLights();
	renderLevel();
	initializePlayer();
	console.log(window.mobileAndTabletCheck());
	if(window.mobileAndTabletCheck()){
		//show debug ui
		$(".mobileOverlay").show();
	}
})();
	