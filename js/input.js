import {player, scene, engine, canvas, gameSettings} from "./main.js";
import * as utils from "./utils.js";

export let isMobile, isTablet, isAndroid, isiPhone, isiPad;
/**
 * @description Initializes `addEventListener`s on "keydown" and "keyup" events.
 * @description Also sets player.movement booleans based on keyboard inputs (appropriate `key.code` values are fetched from `gameSettings.controls`)
 */
export function initKeyboardListeners() {
    const input = gameSettings.controls;
    window.addEventListener("keydown", function (key) {
        if (key.repeat) return; // Don't allow repeat keypress via holding key down
        if (key.code === input.forward || key.code === input.back || key.code === input.left || key.code === input.right) {
            player.movement.isMoving = true;// Sets isMoving to true if player is pressing any movement keys
        }
        if (key.code === input.forward) {player.movement.forward = true;}
        if (key.code === input.back) {player.movement.back = true;}
        if (key.code === input.left) {player.movement.left = true;}
        if (key.code === input.right) {player.movement.right = true;}
        if (key.code === input.jump && !player.movement.readyJump) {player.movement.readyJump = true;}
        if (key.code === input.sprint) {player.movement.sprinting = true;}
        if (key.code === "NumpadAdd"){
            utils.teleportPlayer(new BABYLON.Vector3(0,20,0), true);
        }
        console.log(key.code);
    });
    window.addEventListener("keyup", function (key) {
        if (key.code === input.jump || key.code === input.forward || key.code === input.back || key.code === input.left || key.code === input.right) {
            if (key.code === input.forward) {player.movement.forward = false;}
            if (key.code === input.back) {player.movement.back = false;}
            if (key.code === input.left) {player.movement.left = false;}
            if (key.code === input.right) {player.movement.right = false;}
            if (key.code === input.jump && player.movement.readyJump && player.movement.onGround) {
                player.movement.jumping = true;
                player.movement.readyJump = false;
            }
            if (!player.movement.jumping && !player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right){
                player.movement.isMoving = false;
            }
        }
        if (key.code === input.sprint) {player.movement.sprinting = false;}
        if (key.code === "Tab") {// Tab key to toggle debug mode
            if (!scene.debugLayer.isVisible()) {gameSettings.debugMode = true;scene.debugLayer.show();} else {gameSettings.debugMode = false;scene.debugLayer.hide();}
        }
    });
}
/**
 * @description Initializes misc `window` eventListeners for things like detecting window `"click"`, `"resize"`, and `"load"` events.
 */
export function initWindowFunctions() {
    // Handle window resize events properly
    window.addEventListener("resize", () => {engine.resize()});
    // Sets `isMobile`, `isTablet`, etc... (Code taken from https://code-boxx.com/detect-mobile-device-javascript/ )
    window.addEventListener("load", () => {
        // Check if `userAgent` contains various terms to determine specific device type
        isMobile = navigator.userAgent.toLowerCase().match(/mobile/i);
        isTablet = navigator.userAgent.toLowerCase().match(/tablet/i);
        isAndroid = navigator.userAgent.toLowerCase().match(/android/i);
        isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i);
        isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);
        // Print detected device to console only if `debugMode` is `true` during scene initialization
        if(gameSettings.debugMode) console.log("Mobile", isMobile, "Tablet", isTablet, "Android", isAndroid, "iPhone", isiPhone, "iPad", isiPad);
    });
    // Handle listener for tab/window visibility changes to pause the game
    window.addEventListener('visibilitychange', (onchange) => {if(document.hidden){utils.pauseScene();}else{utils.resumeScene();}});
    // Handle cursor locking
    canvas.addEventListener("click", () => {canvas.requestPointerLock();});
}