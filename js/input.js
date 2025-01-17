import {game, player, scene, engine, canvas, gameSettings} from "./main.js";
import * as utils from "./utils.js";

export function initEventListeners() {

    const input = gameSettings.controls;
    // Detect key presses
    window.addEventListener("keydown", function (e) {
        if (e.repeat) return; // Don't allow repeat keypress via holding key down
        if (e.code === input.forward || e.code === input.back || e.code === input.left || e.code === input.right) {
            player.movement.isMoving = true;// Sets isMoving to true if player is pressing any movement keys
        }
        if (e.code === input.forward) {player.movement.forward = true;}
        if (e.code === input.back) {player.movement.back = true;}
        if (e.code === input.left) {player.movement.left = true;}
        if (e.code === input.right) {player.movement.right = true;}
        if (e.code === input.jump && !player.movement.readyJump) {player.movement.readyJump = true;}
        if (e.code === input.sprint) {player.movement.sprinting = true;}
        if (e.code === "NumpadAdd"){
            utils.teleportPlayer(new BABYLON.Vector3(0,20,0), true);
        }
        console.log(e.code);
    });
    window.addEventListener("keyup", function (e) {
        if (e.code === input.jump || e.code === input.forward || e.code === input.back || e.code === input.left || e.code === input.right) {
            if (e.code === input.forward) {player.movement.forward = false;}
            if (e.code === input.back) {player.movement.back = false;}
            if (e.code === input.left) {player.movement.left = false;}
            if (e.code === input.right) {player.movement.right = false;}
            if (e.code === input.jump && player.movement.readyJump && player.movement.onGround) {
                player.movement.jumping = true;
                player.movement.readyJump = false;
            }
            if (!player.movement.jumping && !player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right){
                player.movement.isMoving = false;
            }
        }
        if (e.code === input.sprint) {player.movement.sprinting = false;}
        if (e.code === "Tab") {// Tab key to toggle debug mode
            if (!scene.debugLayer.isVisible()) {gameSettings.debugMode = true;scene.debugLayer.show();} else {gameSettings.debugMode = false;scene.debugLayer.hide();}
        }
    });
}
export let isMobile, isTablet, isAndroid, isiPhone, isiPad;
export function initWindowFunctions() {
    // Handle window resize events properly
    window.addEventListener("resize", () => {engine.resize()});

    /* From https://code-boxx.com/detect-mobile-device-javascript/ */
    window.addEventListener("load", () => {
        // (A) BREAK USER AGENT DOWN
        isMobile = navigator.userAgent.toLowerCase().match(/mobile/i);
        isTablet = navigator.userAgent.toLowerCase().match(/tablet/i);
        isAndroid = navigator.userAgent.toLowerCase().match(/android/i);
        isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i);
        isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);

        // (B) DETECTED DEVICE TYPE
        if(gameSettings.debugMode) {
            console.log("Mobile", isMobile);
            console.log("Tablet", isTablet);
            console.log("Android", isAndroid);
            console.log("iPhone", isiPhone);
            console.log("iPad", isiPad);
        }
    });

    // Handle cursor locking
    canvas.addEventListener("click", () => {canvas.requestPointerLock();});

    // Handle listener for tab/window visibility changes to pause the game
    document.addEventListener('visibilitychange', (onchange) => {
        if (document.hidden) {
            utils.pauseScene();
        } else {
            utils.resumeScene();
        }
    });
}