import {gameSettings, player} from "./main.js";
import * as utils from "./utils.js";

let desiredMovement = BABYLON.Vector3.Zero(), moveDelayDelta = 0;
/**
 * @desc Handles the player movement and applies forces to the `player.body` based on desired direction.
 * @desc Determines which direction and how strong the force is based on factors like `gameSettings.maxDefaultMoveSpeed
 */
export function handleMovement () {
    const cameraRotation = -player.camera.alpha;
    const forward = new BABYLON.Vector3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
    const right = new BABYLON.Vector3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();
    let lerpedVelo = BABYLON.Vector3.Zero(), currentVelocity = player.body.physicsImpostor.getLinearVelocity();

    // Check & sets canMove, canJump and onGround = true if rayCast below player = true (is colliding below)
    let onGroundCheck = utils.rayCast(player.body, BABYLON.Vector3.Down(), 0.2 + 0.05/* Half player height (+ buffer for slopes) */);
    player.movement.canJump = player.movement.onGround = onGroundCheck;
    player.prevMovementSpeed = player.speed; // Update player.prevMovementSpeed before curMovementSpeed gets updated

    // Calculate desiredMovement, quantize to 45deg increments, & apply final force to player.body
    if(player.movement.canMove && player.movement.isMoving) {
        if (player.movement.right) desiredMovement.addInPlace(forward);
        if (player.movement.left) desiredMovement.addInPlace(forward.scale(-1));
        if (player.movement.back) desiredMovement.addInPlace(right.scale(-1));
        if (player.movement.forward) desiredMovement.addInPlace(right);

        // Handles jump force calculation & sets movement.jumping back to false
        let addJumpForce = false;
        if (player.movement.onGround && player.movement.jumping) {
            desiredMovement.addInPlace((new BABYLON.Vector3.Up()).scale(player.jumpHeight)); // Add vertical force
            addJumpForce = true;
            player.movement.jumping = false;
        }

        // Caps horizontal movement to the player.curMovementSpeed value (preserving y-axis forces)
        if (!desiredMovement.equals(BABYLON.Vector3.Zero())) {
            let oldUp = desiredMovement.normalize().scaleInPlace(gameSettings.defaultMinJumpHeight + player.jumpHeight + player.curMovementSpeed).y;
            desiredMovement.normalize().scaleInPlace(player.curMovementSpeed);
            desiredMovement.y = (addJumpForce) ? oldUp : currentVelocity.y;// Restore y-axis if jumping
        }

        // Gradual force scaling (and delay) before force gets applied to player
        moveDelayDelta = Number(moveDelayDelta.toFixed(3)); // Remove floating point precision errors
        let velocityDeltaScaled = new BABYLON.Vector3(desiredMovement.scale(moveDelayDelta).x, desiredMovement.y, desiredMovement.scale(moveDelayDelta).z);
        lerpedVelo = (moveDelayDelta > 0 ? velocityDeltaScaled : currentVelocity);
        if(moveDelayDelta < 1)moveDelayDelta += gameSettings.defaultMoveAccelerate;

        // Quantize direction of lerpedVelo to 45-degree increments
        const angle = Math.atan2(lerpedVelo.x, lerpedVelo.z);
        const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const magnitude = lerpedVelo.length();
        let finalVelo = new BABYLON.Vector3(
            Math.sin(quantizedAngle) * magnitude,
            lerpedVelo.y, // Preserve Y component for vertical movement
            Math.cos(quantizedAngle) * magnitude
        );

        // Apply final movement force to player.body.physicsImpostor
        player.body.physicsImpostor.setLinearVelocity(finalVelo);
    }

    // Simulated friction (necessary for smooth player movement otherwise)
    if(!player.movement.isMoving && player.movement.onGround){
        if(player.speed > 0){
            if(gameSettings.debugMode) console.log("Simulating friction!", player.speed);
            let curVelo = player.body.physicsImpostor.getLinearVelocity();
            let oldYVelo = curVelo.y;
            let slowerVelo = new BABYLON.Vector3(curVelo.x, oldYVelo, curVelo.z).scale(1 - gameSettings.defaultFriction);
            player.body.physicsImpostor.setLinearVelocity(slowerVelo);
        }
        if(moveDelayDelta > 0)moveDelayDelta = 0; // Reduce value by `gameSettings.defaultMoveAccelerate` to re-enable gradual deceleration
    }

    // Handle sprinting
    if (player.movement.sprinting && player.curMovementSpeed <= player.sprintSpeed) {player.curMovementSpeed += gameSettings.defaultMoveAccelerate;}
    if (!player.movement.sprinting && player.curMovementSpeed > gameSettings.defaultMoveSpeed) {player.curMovementSpeed -= gameSettings.defaultMoveAccelerate;}
    player.curMovementSpeed = Number(player.curMovementSpeed.toFixed(3)); // Fix rounding errors

    // Update player speed and movementDirection values with final calculated values

    player.movementDirection = desiredMovement;
    player.speed = Number(player.body.physicsImpostor.getLinearVelocity().scale(0.99).length().toFixed(2));
}
/**
 * @desc Handles the `player.body` rotation and locks `player.body` rotation to 45 degree increments.
 * @see {syncMeshAndBody} - Handles/syncs `player.mesh` rotation & position values
 * @todo Use current `camera` angle to quantize values instead, some time in the future
 */
export function handleRotation() {
    const normalizedDirection = player.movementDirection.normalize();
    // Calculate desired angle from desiredMovement, then quantize to nearest 45 degrees
    let angle = Math.atan2(normalizedDirection.x, normalizedDirection.z);
    const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    // Limits rotation to Y-axis rotation quaternion (based on new quantized angle)
    const desiredRotation = BABYLON.Quaternion.FromEulerAngles(0, quantizedAngle, 0);
    player.body.rotationQuaternion.normalize();
    player.body.rotationQuaternion = desiredRotation;

    // Lock physics body rotation on X and Z axes
    player.body.physicsImpostor.angularDamping = 0;// Zero damping for instant angularVelocity value
    player.body.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, player.body.physicsImpostor.getAngularVelocity().y, 0));
}
/**
 * @desc Updates the `player.mesh` rotation & position based on `player.body` rotation/position values
 */
export function syncMeshAndBody() {
    // Set player.mesh.skeleton pos to player.mesh pos (prevents mesh position desync during animations)
    player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);

    // Sync player.mesh rotation & position with player.body
    player.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(player.mesh.rotationQuaternion, player.body.rotationQuaternion, gameSettings.defaultRotationSpeed);
    player.mesh.position = new BABYLON.Vector3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);
}