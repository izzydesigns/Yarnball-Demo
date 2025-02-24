import {game, player, engine, gameSettings, canvas, scene} from "./globals.js";

// Get all menu screens
const mainMenu = $("#menus .mainMenu");
const ingameHUDMenu = $("#menus .ingameHUDMenu");
const pauseMenu = $("#menus .pauseMenu");
const settingsMenu = $("#menus .settingsMenu");
// Get all buttons, inputs, and labels
const settings_walkInput = $("#menus .settingsMenu #moveSpeed"),settings_applyWalkBtn = $("#menus .settingsMenu .walkApply");
const settings_sprintInput = $("#menus .settingsMenu #sprintSpeed"),settings_applySprintBtn = $("#menus .settingsMenu .sprintApply");
const settings_jumpInput = $("#menus .settingsMenu #jumpHeight"),settings_applyJumpBtn = $("#menus .settingsMenu .jumpApply");
const settings_debugLabel = $("#menus .settingsMenu .debugMode"),settings_debugBtn = $("#menus .settingsMenu .debugToggle");
const settings_backBtn = $("#menus .settingsMenu .back");
const pause_resumeBtn = $("#menus .pauseMenu .resume"),pause_settingsBtn = $("#menus .pauseMenu .settings"),pause_mainmenuBtn = $("#menus .pauseMenu .mainmenu");
const mainmenu_playBtn = $("#menus .mainMenu .play"),mainmenu_settingsBtn = $("#menus .mainMenu .settings"),mainmenu_exitBtn = $("#menus .mainMenu .exit");
// Get speed progress bar element
const speedProgressBar = $("#menus .ingameHUDMenu .progress-bar");
// Get HUD elements
const hud1ValElem = $("#menus .ingameHUDMenu .value1"), hud2ValElem = $("#menus .ingameHUDMenu .value2");
const hud3ValElem = $("#menus .ingameHUDMenu .value3"), hud4ValElem = $("#menus .ingameHUDMenu .value4");
const hud5ValElem = $("#menus .ingameHUDMenu .value5");
const hudXValElem = $("#menus .ingameHUDMenu .x_value"),hudYValElem = $("#menus .ingameHUDMenu .y_value"),hudZValElem = $("#menus .ingameHUDMenu .z_value");
// Misc variables
export let previousMenu = "";
const lowFPS = [30, "red"], medFPS = [60, "yellow"], highFPS = [120, "green"];

/**
 * @desc Initializes the `game.curMenu` value to `gameSettings.defaultMenu` and various other screen elements like input element values
 */
export function initScreenElements () {
    game.curMenu = gameSettings.defaultMenu;
    if(gameSettings.debugMode)console.log("Initializing default start menu as: "+gameSettings.defaultMenu);
    settings_walkInput.val(gameSettings.defaultMoveSpeed);
    settings_sprintInput.val(gameSettings.defaultSprintSpeed);
    settings_jumpInput.val(gameSettings.defaultJumpHeight);
    // If adding translations/localizations, this would be the place to translate the game text
    // if translating game text, a localization file must be created for each language
}
/**
 * @desc Handles which menu to display when `curMenu` value is changed
 */
export function updateMenus () {
    // Updates on-screen values based on which menu is being displayed
    updateScreenElements(game.curMenu);

    // Handle updates to `game.curMenu` and switch to new screen
    if(game.curMenu !== game.prevMenu) {
        showMenu(game.curMenu);
        previousMenu = game.prevMenu;
        game.prevMenu = game.curMenu;
        if(gameSettings.debugMode)console.log("Changing menus: ", game.curMenu);
    }
}
/**
 * @desc Handle dynamically updating values for UI elements (like the settings menu, ingame HUD data, etc)
 */
function updateScreenElements (menu) {
    switch (menu){
        case "ingame":
            let absoluteFPS = engine.getFps();
            game.currentFPS = absoluteFPS;
            let curPos = player.body.position;
            //Update the ingame HUD elements
            hud1ValElem.text(player.speed.toFixed(1) + " (Raw: " + player.horizontalSpeed.toFixed(2) + ")");
            hud2ValElem.text(player.onGround ? "✔️" : "✖️");
            hud3ValElem.text(player.movement.isSliding ? "✔️" : "✖️");
            hud5ValElem.text(player.tiltDegrees?.toFixed(1) + "/" + gameSettings.defaultMaxSlopeAngle);
            hud4ValElem.text(absoluteFPS.toFixed(0));
            hudXValElem.text(curPos.x.toFixed(1));
            hudYValElem.text(curPos.y.toFixed(1));
            hudZValElem.text(curPos.z.toFixed(1));
            speedProgressBar.width((player.horizontalSpeed / gameSettings.defaultMaxVelocity) * 100 + "%");
            // TODO: Not working? idk why
            /*let isSprinting = player.movement.sprinting && player.movement.canSprint;
            speedProgressBar.attr("background",(isSprinting?"green":"blue")+"!important");*/

            // TODO: Update FPS color based on performance (also not working???)
            /*if(absoluteFPS >= highFPS[0]) {
                hud4ValElem.attr("color", highFPS[1] + "!important");
            }else if(absoluteFPS >= medFPS[0]) {
                hud4ValElem.attr("color", medFPS[1] + "!important");
            }else if(absoluteFPS >= lowFPS[0]){
                hud4ValElem.attr("color",lowFPS[1]+"!important");
            }*/
            break;
        case "settings":
            // Constantly updates the debugLabel status to reflect the current `debugMode` state
            settings_debugLabel.text(gameSettings.debugMode ? "✅" : "❌");
            // Set whether or not specified elements are enabled/disabled according to game.debugMode
            if (!gameSettings.debugMode) {
                if (!settings_applyWalkBtn.attr("disabled")) {
                    settings_applyWalkBtn.attr("disabled", "disabled");
                    settings_applySprintBtn.attr("disabled", "disabled");
                    settings_applyJumpBtn.attr("disabled", "disabled");
                }
                if (!settings_walkInput.attr("disabled")) {
                    settings_walkInput.attr("disabled", "disabled");
                    settings_sprintInput.attr("disabled", "disabled");
                    settings_jumpInput.attr("disabled", "disabled");
                }
            } else if (gameSettings.debugMode) {
                settings_applyWalkBtn.removeAttr("disabled");
                settings_applySprintBtn.removeAttr("disabled");
                settings_applyJumpBtn.removeAttr("disabled");
                settings_walkInput.removeAttr("disabled");
                settings_sprintInput.removeAttr("disabled");
                settings_jumpInput.removeAttr("disabled");
            }
            break;
        default: return;
    }
}
/**
 * @desc Shows specified menu (if value is not listed, default is `mainMenu`)
 */
export function showMenu (menu = "main") {
    $("#menus > *").hide(); // Hide all menus before deciding which menu should be shown
    switch (menu) {
        case "main":
            mainMenu.show();
            return;
        case "ingame":
            ingameHUDMenu.show();
            return;
        case "pause":
            pauseMenu.show();
            return;
        case "settings":
            settingsMenu.show();
            return;
    }
}
/**
 * @desc Handles `.click()` events for all buttons specified
 */
(function handleClickEvents () {
    // Pause menu input handlers
    pause_resumeBtn.click(() => {game.curMenu = "ingame";canvas.requestPointerLock();});
    pause_settingsBtn.click(() => {game.curMenu = "settings";});
    pause_mainmenuBtn.click(() => {game.curMenu = "main";});

    // Main menu input handlers
    // TODO: Handle scene setup/initialization if `scene` is undefiend (aka loading scene for the first time)
    mainmenu_playBtn.click(() => {game.curMenu = "ingame";canvas.requestPointerLock();});
    mainmenu_settingsBtn.click(() => {game.curMenu = "settings";});
    mainmenu_exitBtn.click(() => {if(confirm("Are you sure you want to exit?")) window.close();});

    // Settings menu input handlers
    settings_backBtn.click(() => {if(game.curMenu !== previousMenu) game.curMenu = previousMenu});
    settings_debugBtn.click(() => {
        if (!scene.debugLayer.isVisible()) {
            gameSettings.debugMode = true;
            scene.debugLayer.show().then(() => {});
        } else {
            gameSettings.debugMode = false;
            scene.debugLayer.hide();
        }
        console.log("Changing `gameSettings.debugMode` to "+gameSettings.debugMode);
    });
    settings_applyWalkBtn.click(() => {
        let prevWalkSpeed = player.curMovementSpeed;
        let newWalkSpeed = Number(settings_walkInput.val());
        gameSettings.defaultMoveSpeed = newWalkSpeed;
        player.curMovementSpeed = Number(newWalkSpeed);
        console.log("Setting walk speed to '"+newWalkSpeed+"' (previously '"+prevWalkSpeed+"')");
    });
    settings_applySprintBtn.click(() => {
        let prevSprintSpeed = gameSettings.defaultSprintSpeed;
        let newSprintSpeed = Number(settings_sprintInput.val());
        gameSettings.defaultSprintSpeed = newSprintSpeed;
        player.sprintSpeed = newSprintSpeed;
        console.log("Setting sprint speed to '"+newSprintSpeed+"' (previously '"+prevSprintSpeed+"')");
    });
    settings_applyJumpBtn.click(() => {
        let prevJumpHeight = gameSettings.defaultJumpHeight;
        let newJumpHeight = Number(settings_jumpInput.val());
        gameSettings.defaultJumpHeight = newJumpHeight;
        player.jumpHeight = newJumpHeight;
        console.log("Setting jump height to '"+newJumpHeight+"' (previously '"+prevJumpHeight+"')");
    });
})();
