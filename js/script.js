const canvas = document.getElementById("renderCanvas"); // Get canvas element
const engine = new BABYLON.Engine(canvas, true);// Init 3D engine
var createScene = () => {
  // create Babylon Scene
  var scene = new BABYLON.Scene(engine);
  // create & position camera, target 0,0,0, attach to canvas
  var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  
  // create light, aims into sky - 0,1,0
  var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // The first parameter can be set to null to load all meshes and skeletons
  const loadLevel = BABYLON.SceneLoader.ImportMeshAsync("", "./res/models/", "mainmenu.glb", scene);
  loadLevel.then((result) => {
    //// Result has meshes, particleSystems, skeletons, animationGroups and transformNodes
    console.log(result);
  });
  
  const loadMesh = BABYLON.SceneLoader.ImportMeshAsync("", "./res/models/", "cat_full.glb", scene);
  loadMesh.then((result) => {
    console.log(result);
  });

  return scene;
};
const scene = createScene();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(() => {
  scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", () => {engine.resize();});