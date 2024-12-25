import { game, player, scene, engine, canvas } from "./main.js";
import * as utils from "./utils.js";

export function initEventListeners() {
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
        if(e.code === game.controls.sprint) player.movement.sprinting = true;
        if(e.code === "NumpadAdd"){
            console.log("test");
            utils.teleportPlayer(new BABYLON.Vector3(0,20,0), true);
        }
        console.log(e.code);
    });
    window.addEventListener("keyup", function (e) {
        if (e.code === game.controls.jump || e.code === game.controls.forward || e.code === game.controls.back || e.code === game.controls.left || e.code === game.controls.right) {
            if (e.code === game.controls.forward) {player.movement.forward = false;}
            if (e.code === game.controls.back) {player.movement.back = false;}
            if (e.code === game.controls.left) {player.movement.left = false;}
            if (e.code === game.controls.right) {player.movement.right = false;}
            if(!player.movement.jumping && !player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right){
                player.movement.isMoving = false;
            }
        }
        if(e.code === game.controls.sprint) player.movement.sprinting = false;
        if (e.code === "Tab") {// Tab key to toggle debug mode
            if (!scene.debugLayer.isVisible()) {game.debugMode = true;scene.debugLayer.show();} else {game.debugMode = false;scene.debugLayer.hide();}
        }
    });

    // Handle window resize events properly
    window.addEventListener("resize", () => {engine.resize()});
}
export let isMobile, isTablet, isAndroid, isiPhone, isiPad;
export function initWindowFunctions() {
    /* From https://code-boxx.com/detect-mobile-device-javascript/ */
    window.addEventListener("load", () => {
        // (A) BREAK USER AGENT DOWN
        isMobile = navigator.userAgent.toLowerCase().match(/mobile/i);
        isTablet = navigator.userAgent.toLowerCase().match(/tablet/i);
        isAndroid = navigator.userAgent.toLowerCase().match(/android/i);
        isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i);
        isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);

        // (B) DETECTED DEVICE TYPE
        if(game.debugMode) {
            console.log("Mobile", isMobile);
            console.log("Tablet", isTablet);
            console.log("Android", isAndroid);
            console.log("iPhone", isiPhone);
            console.log("iPad", isiPad);
        }
    });

    // Handle cursor locking
    canvas.addEventListener("click", () => {canvas.requestPointerLock();});
}