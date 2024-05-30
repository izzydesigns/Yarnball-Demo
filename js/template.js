const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
var createScene = function () {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // Our built-in 'sphere' shape.
  //var defaultCube = BABYLON.MeshBuilder.CreateBox("cube", {size: 1}, scene);

  BABYLON.SceneLoader.ImportMesh("", "./", "cat.glb", scene, function (meshes) {
    // Callback function after the mesh is loaded
    // 'meshes' will contain an array of all loaded meshes
    // You can access and manipulate the loaded mesh here
    var catMesh = meshes[0]; // Assuming the cat is the first mesh loaded
    
    // Additional operations on the cat mesh if needed
  });

  return scene;
};
const scene = createScene(); //Call the createScene function
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scene.render();
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});



