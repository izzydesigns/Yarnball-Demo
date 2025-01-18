import {game, player, engine, gameSettings, canvas, scene} from "./main.js";

// Get all menus
const mainMenu = $("#menus .mainMenu");
const ingameHUDMenu = $("#menus .ingameHUDMenu");
const pauseMenu = $("#menus .pauseMenu");
const settingsMenu = $("#menus .settingsMenu");
// Get all buttons
const pause_resumeBtn = $("#menus .pauseMenu .resume");
const pause_settingsBtn = $("#menus .pauseMenu .settings");
const pause_mainmenuBtn = $("#menus .pauseMenu .mainmenu");
const mainmenu_playBtn = $("#menus .mainMenu .play");
const mainmenu_settingsBtn = $("#menus .mainMenu .settings");
const mainmenu_exitBtn = $("#menus .mainMenu .exit");
const settings_walkInput = $("#menus .settingsMenu #moveSpeed");
const settings_applyWalkBtn = $("#menus .settingsMenu .walkApply");
const settings_sprintInput = $("#menus .settingsMenu #sprintSpeed");
const settings_applySprintBtn = $("#menus .settingsMenu .sprintApply");
const settings_jumpInput = $("#menus .settingsMenu #jumpHeight");
const settings_applyJumpBtn = $("#menus .settingsMenu .jumpApply");
const settings_debugBtn = $("#menus .settingsMenu .debugToggle");
const settings_debugLabel = $("#menus .settingsMenu .debugMode");
const settings_backBtn = $("#menus .settingsMenu .back");
// Get speed progress bar element
const speedProgressBar = $("#menus .ingameHUDMenu .progress-bar");
// Get HUD elements
const speedValElem = $("#menus .ingameHUDMenu .speed_value");
const fpsValElem = $("#menus .ingameHUDMenu .fps_value");
const jumpValElem = $("#menus .ingameHUDMenu .jump_value");
const inAirValElem = $("#menus .ingameHUDMenu .inAir_value");
const sprintValElem = $("#menus .ingameHUDMenu .sprint_value");

export let previousMenu = "";

// Initialize screen UI elements
export function initScreenElements () {
    game.curMenu = gameSettings.defaultMenu;
    if(gameSettings.debugMode)console.log("Initializing default start menu as: "+gameSettings.defaultMenu);
    settings_walkInput.val(gameSettings.defaultMoveSpeed);
    settings_sprintInput.val(gameSettings.defaultSprintSpeed);
    settings_jumpInput.val(gameSettings.defaultJumpHeight);
    // If adding translations/localizations, this would be the place to translate the game text
    // if translating game text, a localization file must be created for each language
}

// Handles which menu to display when `curMenu` value is changed
export function updateMenus () {
    // Updates game HUD values
    updateScreenElements();

    // Handle updates to `game.curMenu` and switch to new screen
    if(game.curMenu !== game.prevMenu) {
        showMenu(game.curMenu);
        previousMenu = game.prevMenu;
        game.prevMenu = game.curMenu;
        if(gameSettings.debugMode)console.log("Changing menus: ", game.curMenu);
    }
}

// Handle dynamically updating values for UI elements (like the settings menu, ingame HUD data, etc)
function updateScreenElements () {
    if(game.curMenu === "ingame"){
        //Update the ingame HUD elements
        speedValElem.text(player.speed.toFixed(1)+" (Raw: "+player.speed+")");
        jumpValElem.text(player.movement.readyJump?"✔️":"✖️");
        inAirValElem.text(!player.movement.onGround?"✔️":"✖️");
        sprintValElem.text(player.movement.sprinting?"✔️":"✖️");
        let absoluteFPS = engine.getFps();
        game.currentFPS = absoluteFPS;
        fpsValElem.text(absoluteFPS.toFixed(0));
        speedProgressBar.width((player.speed / gameSettings.defaultSprintSpeed) * 100+"%");
    }
    if(game.curMenu === "settings"){
        // Constantly updates the debugLabel status to reflect the current `debugMode` state
        settings_debugLabel.text(gameSettings.debugMode?"✅":"❌");
        // Set whether or not specified elements are enabled/disabled according to game.debugMode
        if(!gameSettings.debugMode){
            if(!settings_applyWalkBtn.attr("disabled")) {
                settings_applyWalkBtn.attr("disabled", "disabled");
                settings_applySprintBtn.attr("disabled", "disabled");
                settings_applyJumpBtn.attr("disabled", "disabled");
            }
            if(!settings_walkInput.attr("disabled")){
                settings_walkInput.attr("disabled", "disabled");
                settings_sprintInput.attr("disabled", "disabled");
                settings_jumpInput.attr("disabled", "disabled");
            }
        }else if(gameSettings.debugMode){
            settings_applyWalkBtn.removeAttr("disabled");
            settings_applySprintBtn.removeAttr("disabled");
            settings_applyJumpBtn.removeAttr("disabled");
            settings_walkInput.removeAttr("disabled");
            settings_sprintInput.removeAttr("disabled");
            settings_jumpInput.removeAttr("disabled");
        }
    }
}

// Shows the specified menu (if value is not listed, default shows `mainMenu`)
export function showMenu (menu) {
    $("#menus > *").hide();
    switch (menu) {
        case "ingame":
            ingameHUDMenu.show();
            return;
        case "main":
            mainMenu.show();
            return;
        case "pause":
            pauseMenu.show();
            return;
        case "settings":
            settingsMenu.show();
            return;
        default:
            if(menu.length > 0)console.log("Menu '"+menu+"' was invalid. Use one of the following: ",game.menus);
            return;
    }
}

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
        scene.debugLayer.show();
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
    console.log("Setting walk speed to '"+newSprintSpeed+"' (previously '"+prevSprintSpeed+"')");
});
settings_applyJumpBtn.click(() => {
    let prevJumpHeight = gameSettings.defaultJumpHeight;
    let newJumpHeight = Number(settings_jumpInput.val());
    gameSettings.defaultJumpHeight = newJumpHeight;
    player.jumpHeight = newJumpHeight;
    console.log("Setting jump height to '"+newJumpHeight+"' (previously '"+prevJumpHeight+"')");
});

/*

Set which screen menus are visible during what times

Update values on-screen (if visible)

Handle menu button presses

 */