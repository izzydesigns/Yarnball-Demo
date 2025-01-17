import {player, scene, gameSettings, game} from "./main.js";

/**
 * @description Object containing raw `animationGroup` names, multiple animation names provided to specify which animations have a follow-up animation that must be played upon completion
 * @type {{crawl: string[], crouchToStand: string[], gallop: string[], idleCrouch: string[], jumpHighIdle: string[], idleLaying: string[], idleSit: string[], idleSitClean: string[], idleSleep: string[], idleStand: string[], idleStandClean: string[], jump: string[], jumpHigh: string[], pull: string[], push: string[], sitToStand: string[], standToCrouch: string[], standToGallop: string[], standToJumpHighIdle: string[], standToSit: string[], standToTrot: string[], standToWalk: string[], turnLeft180: string[], turnLeft45: string[], turnLeft90: string[], turnRight180: string[], turnRight45: string[], turnRight90: string[], attack: string[], trot: string[], walk: string[], walkToStand: string[], walkToTrot: string[]}}
 */
export const animationData = {
    // Player animation list: [animationGroup.name, nextAnimation?]
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
 * @description Used to apply specific qualities to all/some animations (mainly used to assign default animation weight & blending status)
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
 * @description Returns which player animation should be playing based on the player's data
 */
function determineAnimationState() {
    if(player.curAnimation !== player.lastAnimation) {
        // Handle jumping/falling animations
        if(!player.movement.onGround){
            if(player.movement.jumping){
                // TODO: Fix code (not playing???)
                return animationData.jump;
            }else{
                // TODO: Implement start/end frame specifications, and start anim half way through (falling)
                return animationData.jumpHigh;
            }
        }

        // Handle movement stopping animations
        if(!player.movement.isMoving && player.curAnimation !== animationData.idleStand && player.speed > 0){
            //console.log("Player stopped moving");
            return animationData.walkToStand;
        }

        // Handle player.speed changing which animations to use while onGround
        switch (player.movement.onGround) {
            case player.speed <= gameSettings.defaultMoveSpeed && player.speed > 0:
                if(gameSettings.debugMode) console.log("Player walking");
                return animationData.walk;
            case player.speed > gameSettings.defaultMoveSpeed && player.speed < gameSettings.defaultSprintSpeed:
                if(gameSettings.debugMode) console.log("Player trotting");
                return animationData.trot;
            case player.speed >= gameSettings.defaultSprintSpeed:
                if(gameSettings.debugMode) console.log("Player sprinting");
                return animationData.gallop;
            case player.movement.readyJump && player.movement.onGround && player.speed <= gameSettings.defaultSprintSpeed:
                if(gameSettings.debugMode) console.log("Player ready to jump");
                return animationData.jumpHighIdle;
            default:
                // If nothing else has returned by now, we must be idling...
                if(gameSettings.debugMode) console.log("Player idling");
                return animationData.idleStand;
        }
    }
}
/**
 * @description Logic code run every frame to detect changes to the player animation state
 */
export function handleAnimations() {
    if(player.curAnimation !== player.lastAnimation) {
        const newState = determineAnimationState();
        if (!newState || newState === player.curAnimation) return;
        playAnimation(newState);
    }
}
/**
 * @description Animation playing handler (allows looping, start, and stop time specification per animation)
 */
function playAnimation(animName, loop = true, startFrame = 0, endFrame = undefined) {
    if(!animName[1]){ // Single animation being played
        const animGroup = scene.getAnimationGroupByName(animName[0]);
        if (animGroup) { // add && !player.isAnimTransitioning if you want single animations to finish before playing new animation
            // Stop all other animations on the mesh before proceeding
            let playingAnimations = scene.animationGroups.filter(group => group.isPlaying);
            playingAnimations.forEach(group => {group.stop();group.weight = 0;});

            animGroup.reset();
            animGroup.start(loop, 1.0, startFrame, endFrame ? endFrame : animGroup.to);
            animGroup.weight = 1;
            player.lastAnimation = player.curAnimation;
            player.curAnimation = animName;
            return;
        }
    }else{ // Animation + completion animation being played
        // Retrieve animName[0] animation key from animationData object (if it exists)
        const animKey = Object.values(animationData).find(anim => anim[0] === animName[0]);if (!animKey) return;
        // Get transition animationGroup (if it exists)
        const transitionAnim = scene.getAnimationGroupByName(animKey[0]);if (!transitionAnim) return;
        // Get idle animationGroup (if it exists)
        const idleAnim = scene.getAnimationGroupByName(animName[1]);if (!idleAnim) return;

        // Stop all other animations on the mesh before proceeding
        scene.animationGroups.forEach((animGroup) => {
            if (animGroup !== transitionAnim && animGroup !== idleAnim) {
                animGroup.stop(); // Stop any currently playing animations before playing new ones
                animGroup.weight = 0;
            }
        });

        // Sets specified starting frame (if it is specified)
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
        }

        // Play the original desired animation, then set isTransitioning to true until animation has completed.
        transitionAnim.play(false);
        transitionAnim.weight = 1;
        transitionAnim.onAnimationGroupPlayObservable.addOnce(() => {player.isAnimTransitioning = true});
        transitionAnim.onAnimationGroupEndObservable.addOnce(() => {
            transitionAnim.stop();
            transitionAnim.weight = 0;
            idleAnim.reset(); // Reset to the start of the idle animation
            idleAnim.play(true); // Play idle animation on a loop
            idleAnim.weight = 1;
            player.isAnimTransitioning = false;
        });

        player.lastAnimation = player.curAnimation;
        player.curAnimation = animName;
    }
    return false;
}
