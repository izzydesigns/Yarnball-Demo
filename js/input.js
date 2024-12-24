import { game, player, scene, engine, canvas } from "./main.js";

export function inputHandler() {
    // Detect key presses
    window.addEventListener("keydown", function (e) {
        if (e.repeat) return; // Don't allow repeat keypress via holding key down
        if (e.code === game.controls.jump || e.code === game.controls.forward || e.code === game.controls.back || e.code === game.controls.left || e.code === game.controls.right) {
            if (e.code === game.controls.forward) {player.movement.forward = true;}
            if (e.code === game.controls.back) {player.movement.back = true;}
            if (e.code === game.controls.left) {player.movement.left = true;}
            if (e.code === game.controls.right) {player.movement.right = true;}
            if (e.code === game.controls.jump && player.movement.onGround) {player.movement.jumping = true;}
            player.movement.isMoving = true;
        }
        if (e.code === "Tab") {// Tab key to toggle debug mode
            if (!scene.debugLayer.isVisible()) {game.debugMode = true;scene.debugLayer.show();} else {game.debugMode = false;scene.debugLayer.hide();}
        }
        console.log("Key pressed: ",e.code);
    });
    window.addEventListener("keyup", function (e) {
        if (e.code === game.controls.forward || e.code === game.controls.back || e.code === game.controls.left || e.code === game.controls.right) {
            if (e.code === game.controls.forward) {player.movement.forward = false;}
            if (e.code === game.controls.back) {player.movement.back = false;}
            if (e.code === game.controls.left) {player.movement.left = false;}
            if (e.code === game.controls.right) {player.movement.right = false;}
        }

    });

    // Handle window resize events properly
    window.addEventListener("resize", () => {engine.resize()});

    // Handle cursor locking
    canvas.addEventListener("click", () => {canvas.requestPointerLock();});
}