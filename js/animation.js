import {player, scene, gameSettings, game} from "./globals.js";
import * as movement from "./movement.js";

/**
 * @desc Object containing raw `animationGroup` names, multiple animation names provided specify which animations have a follow-up animation that must be played upon completion
 */
export const animationData = {
    // Player animation list: [animationGroup.name, nextAnimation?]
    // TODO: Add ability to specify blendingSpeed values for each animation, i.e. idleSleep should be 0.025 but the default is 0.1
    // TODO: Add a way to specify custom start & stop frames (use percentage value from 0 to 100)
    crawl: ["cat_crawl"],
    crouchToStand: ["crouchA_toStandA", "cat_idleStandA"],
    gallop: ["cat_gallop"],
    idleCrouch: ["cat_idleCrouchA"],
    jumpHighIdle: ["cat_idleJumpHighReady"],
    idleLaying: ["cat_idleLayDown"],
    idleSit: ["cat_idleSitA"],
    idleSitClean: ["cat_idleSitClean"],
    idleSleep: ["cat_idleSleep"],
    idleStand: ["cat_idleStandA"],
    idleStandClean: ["cat_idleStandClean"],
    jump: ["cat_jump", "cat_idleStandA"],
    jumpHigh: ["cat_jumpHigh", "cat_idleStandA"],
    pull: ["cat_pull"],
    push: ["cat_push"],
    sitToStand: ["cat_sitA_toStandA", "cat_idleStandA"],
    standToCrouch: ["cat_standA_toCrouch", "cat_idleCrouchA"],
    standToGallop: ["cat_standA_toGallop", "cat_gallop"],
    standToJumpHighIdle: ["cat_standA_toJumpHighReady", "cat_idleJumpHighReady"],
    standToSit: ["cat_standA_toSit", "cat_idleSitA"],
    standToTrot: ["cat_standA_toTrot", "cat_trot"],
    standToWalk: ["cat_standA_toWalk", "cat_walk"],
    turnLeft180: ["cat_standA_turneLeft180", "cat_idleStandA"],
    turnLeft45: ["cat_standA_turnLeft45", "cat_idleStandA"],
    turnLeft90: ["cat_standA_turnLeft90", "cat_idleStandA"],
    turnRight180: ["cat_standA_turnRight180", "cat_idleStandA"],
    turnRight45: ["cat_standA_turnRight45", "cat_idleStandA"],
    turnRight90: ["cat_standA_turnRight90", "cat_idleStandA"],
    attack: ["cat_standAAttack", "cat_idleStandA"],
    trot: ["cat_trot"],
    walk: ["cat_walk"],
    walkToStand: ["cat_walk_toStandA", "cat_idleStandA"],
    walkToTrot: ["cat_walk_toTrot", "cat_trot"],
};
/**
 * @desc Used to apply specific qualities to all/some animations (mainly used to assign default animation weight & blending status)
 */
export function initAnimations() {
    for (let animations of scene.animationGroups) game.animations.push(animations.name)

    // Loop through all animationGroups in the scene & initialize their weight, enableBlending, and blendingSpeed values
    if (game.animations.length > 0) {
        for (let i = 0; i < game.animations.length; i++) {
            let curAnim = scene.getAnimationGroupByName(game.animations[i]);
            if (curAnim) {
                curAnim.weight = 0;
                curAnim.enableBlending = true;
                curAnim.blendingSpeed = gameSettings.defaultAnimBlendValue;
            }
        }
    }
}
/**
 * @desc Returns which player animation should be playing based on the player's data
 */
function getAnimationState() {

    // Handle player idling animation
    if(player.lastMoveTime + gameSettings.defaultTimeBeforeSleepIdle <= game.time){
        if(!player.isSleeping){player.isSleeping = true;}
        return animationData.idleSleep;
    }

    // Handle jumping/falling animations
    if(player.movement.jumping && player.onGround && !movement.jumpedTooRecently){
        if(gameSettings.debugMode) console.log("Player jumped!");
        return animationData.jump;
    }else if(!player.onGround){
        if(gameSettings.debugMode) console.log("Player is falling!");
        // TODO: Implement start/end frame specifications, and start anim half way through (falling)
        return animationData.jumpHigh;
    }

    // Handle player.speed changing which animations to use while onGround
    // Update 1/22/25 - Changed values for walk trot and gallop to fixed values since player movement values will vary
    // Update 1/27/25 - Applying player.scale to arbitrarily assigned values to maintain consistency with player scaling
    switch (player.onGround) {
        /* Requires PROPER implementation before being usable
        case player.movement.readyJump && player.movement.canJump && !player.movement.isMoving && !movement.jumpedTooRecently:
            if(gameSettings.debugMode) console.log("Player ready to jump");
            return animationData.standToJumpHighIdle;*/
        case player.speed > 0 && !player.movement.isMoving && player.curAnimation !== animationData.idleStand:
            if(gameSettings.debugMode) console.log("Player stopped moving");
            return animationData.walkToStand;
        case player.movement.isSliding:
            if(gameSettings.debugMode) console.log("Player is sliding on steep surface");
            return animationData.walk;
        case player.speed < (0.99 * player.scale) && player.speed > 0:
            if(gameSettings.debugMode) console.log("Player walking");
            return animationData.walk;
        case player.speed >= (0.99 * player.scale) && player.speed < (2.25 * player.scale):
            if(gameSettings.debugMode) console.log("Player trotting");
            return animationData.trot;
        case player.speed >= (2.25 * player.scale):
            if(gameSettings.debugMode) console.log("Player sprinting");
            return animationData.gallop;
        case player.speed === 0:
            // If nothing else has returned by now and player.speed = 0, we must be idling...
            return animationData.idleStand;
    }
}
/**
 * @desc Logic code run every frame to detect changes to the player animation state
 */
export function handleAnimations() {
    const newState = getAnimationState();
    if (!newState || newState === player.curAnimation) return;
    if(player.curAnimation !== newState) {
        playAnimation(newState);
        //console.log("playing new anim!",newState);
    }
}
/**
 * @desc Animation playing handler (allows looping, start, and stop time specification per animation)
 */
export function playAnimation(newAnim, loop = true, startFrame = 0, endFrame = undefined) {
    if(Array.isArray(newAnim) && newAnim[0] !== player.curAnimation[0]) {
        if (newAnim[1]) { // If there is a second animation in the newAnim array, handle appropriately
            // Retrieve newAnim[0] animation key from animationData object (if it exists)
            const animKey = Object.values(animationData).find(anim => anim[0] === newAnim[0]);if (!animKey) return;
            const transitionAnim = scene.getAnimationGroupByName(animKey[0]);if (!transitionAnim) return;
            const idleAnim = scene.getAnimationGroupByName(newAnim[1]);if (!idleAnim) return;

            stopAllAnimations(); // Stop all other animations

            /*// Sets specified starting frame (currently disabled, seemingly not working?)
            if (startFrame > 0) {
                transitionAnim.goToFrame(startFrame);
                transitionAnim.play(false);
                transitionAnim.weight = 1;
                return;
            }

            // Wait for the transition animation to complete, then play the next animation (usually idle animation)
            let curFrame = transitionAnim.getCurrentFrame();
            if (endFrame !== undefined && curFrame >= endFrame) {
                transitionAnim.stop();
                transitionAnim.weight = 0;
                idleAnim.reset(); // Reset to the start of the idle animation
                idleAnim.play(true); // Play idle animation on a loop
                idleAnim.weight = 1;
                player.isAnimTransitioning = false;
                return;
            }*/

            // Play the original desired animation, then set isTransitioning to true until animation has completed.
            transitionAnim.reset();transitionAnim.play(false);transitionAnim.weight = 1;
            if(gameSettings.debugMode)console.log("playing transition anim: ", newAnim[0]," (on completion, play: ",newAnim[1],")");

            player.isAnimTransitioning = true;
            player.lastAnimation = player.curAnimation;player.curAnimation = newAnim;

            transitionAnim.onAnimationGroupEndObservable.addOnce(() => {
                stopAllAnimations(); // Stop all other animations
                idleAnim.reset();idleAnim.play(true);idleAnim.weight = 1;
                if(gameSettings.debugMode)console.log("playing final anim: ", newAnim[1]);
                player.isAnimTransitioning = false;
            });

            return;
        }
        if (scene.getAnimationGroupByName(newAnim[0])) {
            const desiredPlayAnim = scene.getAnimationGroupByName(newAnim[0]);
            stopAllAnimations(); // Stop all other animations on the mesh before proceeding
            // Reset, start, and `weight=1` on our desiredPlayAnim
            desiredPlayAnim.reset();
            desiredPlayAnim.start(loop, 1.0, startFrame, endFrame ? endFrame : desiredPlayAnim.to);
            desiredPlayAnim.weight = 1;
            // Slow the sleeping animation transition speed down
            if(newAnim[0] === "cat_idleSleep" && desiredPlayAnim.blendingSpeed !== 0.025) desiredPlayAnim.blendingSpeed = 0.025;
            player.lastAnimation = player.curAnimation;player.curAnimation = newAnim; // Update `curAnimation` & `lastAnimation`
            if(gameSettings.debugMode)console.log("playing anim: ", newAnim[0]);
            return;
        }
    }
    return false;
}
/**
 * @desc Stops ALL animations loaded in the scene via `scene.animationGroups`, calling .stop() and weight = 0
 */
export function stopAllAnimations() {scene.animationGroups.forEach(group => {group.stop();group.weight = 0;})}