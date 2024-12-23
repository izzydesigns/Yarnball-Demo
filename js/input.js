import * as utils from "./utils.js";

export function inputHandler(game, player, scene) {
    // Detect key presses
    window.addEventListener("keydown", function (e) {
        if (e.repeat) return; // Don't allow repeat keypress via holding key down
        if (e.key === game.controls.forward || e.key === game.controls.back || e.key === game.controls.left || e.key === game.controls.right) {
            if (e.key === game.controls.forward) {player.movement.forward = true;}
            if (e.key === game.controls.back) {player.movement.back = true;}
            if (e.key === game.controls.left) {player.movement.left = true;}
            if (e.key === game.controls.right) {player.movement.right = true;}
            player.movement.isMoving = true;
            //TODO: fix this later
            utils.stopAllAnimationsForMesh(player.mesh, scene);
            utils.playAnimation("cat_walk", scene);
        }
        //TODO: THIS IS PROBABLY BREAKING THE JUMP LOGIC
        if (e.key === game.controls.jump && !player.movement.jumping && player.movement.canJump) {
            //player.movement.jumping = true;//TODO: THIS IS PROBABLY BREAKING THE JUMP LOGIC
            //player.movement.isMoving = true;//TODO: THIS IS PROBABLY BREAKING THE JUMP LOGIC
            //player.movement.canMove = false; // Disable other movement during the jump
            //utils.playAnimation("cat_jump", scene);
        }
        if (e.key === "Tab") {
            if (!scene.debugLayer.isVisible()) {scene.debugLayer.show();} else {scene.debugLayer.hide();}
        }
    });
    window.addEventListener("keyup", function (e) {
        if (e.key === game.controls.forward || e.key === game.controls.back || e.key === game.controls.left || e.key === game.controls.right) {
            if (e.key === game.controls.forward) {player.movement.forward = false;}
            if (e.key === game.controls.back) {player.movement.back = false;}
            if (e.key === game.controls.left) {player.movement.left = false;}
            if (e.key === game.controls.right) {player.movement.right = false;}
        }
        //TODO: ALSO WHAT IS THIS DOING HERE? IS THIS EVEN NECESSARY?
        if (player.movement.isMoving && (!player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right)) {
            player.movement.isMoving = false;

            utils.stopAnimation("cat_walk", scene);
            utils.playAnimation("cat_idleStandA", scene);
        }
    });

    // Handle window resize events properly
    window.addEventListener("resize", () => {engine.resize()});
}