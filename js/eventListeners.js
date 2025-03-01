import {player, scene, engine, canvas, gameSettings, game} from "./globals.js";
import * as utils from "./utils.js";
import {vec3} from "./utils.js";

export let isMobile, isTablet, isAndroid, isiPhone, isiPad;
let axisHelper; // Local variable containing a debug axisHelper

/**
 * @description Initializes `addEventListener`s on "keydown" and "keyup" events.
 * @description Also sets `player.movement` booleans based on keyboard inputs (appropriate `key.code` values are fetched from globals.js -> `gameSettings.controls`)
 */
export function initKeyboardListeners() {
    let debugLayer = scene.debugLayer;
    const input = gameSettings.controls;
    window.addEventListener("keydown", function (key) {
        if (document.pointerLockElement)key.preventDefault(); // Prevents browser keys like tab and alt from triggering while ingame
        if (key.repeat) return; // Don't allow repeat keypress via holding key down
        if(gameSettings.debugMode) console.log(key.code);
        if (key.code === input.forward || key.code === input.back || key.code === input.left || key.code === input.right) {
            player.movement.isMoving = true; // Sets isMoving to true if player is pressing any directional keys
        }
        if (key.code === input.forward) {player.movement.forward = true;}
        if (key.code === input.back) {player.movement.back = true;}
        if (key.code === input.left) {player.movement.left = true;}
        if (key.code === input.right) {player.movement.right = true;}
        if (key.code === input.jump && !player.movement.readyJump && !player.movement.isSliding) {player.movement.readyJump = true;}
        if (key.code === input.sprint && player.movement.canSprint) {player.movement.sprinting = true;}
        if (key.code === input.walk) {player.movement.walking = true;}
        if (key.code === "NumpadAdd") {
            utils.teleportPlayer(vec3(0,15,0));
            utils.deleteMeshesByName("generateRandomBoxes");
            utils.generateRandomBoxes(50, [0,5,0], [25,5,25], [[0.1,5], [0.1,0.1], [0.1,5]],5);
            utils.generateRandomBoxes(50, [0,5,0], [25,5,25], [[0.1,5], [0.1,0.1], [0.1,5]]);
        }
        if (key.code === "NumpadSubtract"){
            utils.teleportPlayer(vec3(0,2,0));
        }
    });
    window.addEventListener("keyup", function (key) {
        if (document.pointerLockElement)key.preventDefault(); // Prevents browser keys like tab and alt from triggering while ingame
        if (key.code === input.jump || key.code === input.forward || key.code === input.back || key.code === input.left || key.code === input.right) {
            if (key.code === input.forward) {player.movement.forward = false;}
            if (key.code === input.back) {player.movement.back = false;}
            if (key.code === input.left) {player.movement.left = false;}
            if (key.code === input.right) {player.movement.right = false;}
            if (key.code === input.jump && player.movement.readyJump) {
                player.movement.jumping = player.onGround;
                player.movement.readyJump = false;
            }
            if (!player.movement.jumping && !player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right){
                player.movement.isMoving = false;
            }
        }
        if (key.code === input.walk) {player.movement.walking = false;}
        if (key.code === input.sprint && player.movement.sprinting) {player.movement.sprinting = false;}
        if (key.code === gameSettings.controls.developerMenu) {// Tab key to toggle debug mode
            console.log("Toggling debug layer",gameSettings.debugMode);
            if (!scene.debugLayer.isVisible()) {gameSettings.debugMode = true;debugLayer.show().then();}
            else {gameSettings.debugMode = false;debugLayer.hide();}
            if(gameSettings.debugMode){ // Draws/creates an axisHelpers
                if(!axisHelper){axisHelper = utils.showAxisHelper(1, vec3(0,1,0));}
                else{axisHelper.setEnabled(true);}
            }else{axisHelper.setEnabled(false);}
        }
    });
}
/**
 * @description Initializes misc `window` eventListeners for things like detecting window "click", "resize", and "load" events.
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
    // Confirms the player wants to exit before closing the window
    window.onbeforeunload = (event) => {
        if(gameSettings.askBeforeClosing) {
            const confirmationMessage = "Are you sure you want to exit?";
            event.preventDefault();
            // Most modern browsers require assigning a value to event.returnValue
            // even though the message itself won't be displayed
            event.returnValue = confirmationMessage; // For legacy browsers
            return confirmationMessage; // Optional, some browsers may use this
        }
    }
    // Handle listener for tab/window visibility changes to pause the game
    document.addEventListener('visibilitychange', () => {
        if(document.hidden){
            // Pause game
            utils.pauseScene();
            game.paused = true;
            if(gameSettings.debugMode)console.log("Pausing scene...");
        }else{
            // Resume game
            utils.resumeScene();
            game.paused = false;
            if(gameSettings.debugMode)console.log("Resuming scene...");
        }
    });
    // Prevents user from opening context menu via right clicking
    document.addEventListener('contextmenu', (event) => {event.preventDefault()});
    // Handle cursor locking
    canvas.addEventListener("click", () => {canvas.requestPointerLock();});
    // Check pointerlock, if triggered, set curMenu to paused (desktop only, mobile support will need a dif approach?)
    window.addEventListener("pointerlockchange", () => {
        game.curMenu = (document.pointerLockElement !== canvas)?"pause":"ingame";
        if(gameSettings.debugMode)console.log("`pointerlockchange` Event triggered, pointer "+((game.curMenu === "ingame")?"":"no longer ")+"locked.");
    });
}