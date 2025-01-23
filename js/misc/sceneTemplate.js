let canvas = /** @type {HTMLCanvasElement} */ document.getElementById("renderCanvas"); // Get canvas element
let engine = new BABYLON.Engine(canvas, true); // Initialize BABYLON 3D engine

let createScene = () => {

	// Create first scene
	let scene = new BABYLON.Scene(engine);

	// Add an ArcRotateCamera and attach it to the canvas
	let camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0,0,5), scene);
	camera.attachControl(canvas, true);

	// Add lights
	let light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
	light1.intensity = 0.8;
	let light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);
	light2.intensity = 0.6

	// Meshes
	let sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:2}, scene);

	camera.setTarget(sphere.position);

	return scene;
};
let scene = createScene(); //Define 'scene' variable & call createScene

// Calls scene.render and anything else inside this function, every frame
engine.runRenderLoop(() => { 
	scene.render();
});

// Handle canvas resize events
window.addEventListener("resize", () => {engine.resize();});