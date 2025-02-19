import {game, gameSettings, player} from "./main.js";
import * as utils from "./utils.js";
import {clampVector3ToMaxLength, quat, vec, vec3} from "./utils.js";

let desiredMovement = vec3(), moveDelayDelta = 0, lastJumpTime = 0;
export let jumpedTooRecently = false;
/**
 * @desc Handles the player movement and applies forces to the `player.body` based on desired direction.
 * @desc Determines which direction and how strong the force is based on factors like `gameSettings.maxDefaultMoveSpeed
 */
export function handleMovement () {
    const cameraRotation = -player.camera.alpha; // Negative value because we're in third person and we want the forward direction
    const camForward = vec3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
    const camRight = vec3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();
    let lerpedVelo = vec3(), finalVelocity = vec3(), curLinearVelo = player.body.physicsImpostor.getLinearVelocity();
    // Initialize jump delay timer
    //if(lastJumpTime===0)lastJumpTime=game.time - gameSettings.defaultJumpDelay;
    // Check & sets canMove, canJump and onGround = true if rayCast below player = true (is colliding below)
    let onGroundCheck = utils.checkCanJump((0.2 + gameSettings.jumpDetectionBuffer) * player.scale /* Half player height + buffer for slopes */);
    // Set onGround, canJump, and canSprint to true if the onGroundCheck.hit returns a value
    player.onGround = player.movement.canJump = player.colliding = onGroundCheck.hit;
    player.curLookDirection = player.camera.getDirection(player.body.position);
    player.prevSpeed = player.speed; // Update player.prevSpeed before horizontalSpeed gets updated

    // Handles jump force calculation & sets movement.jumping back to false any time it's set to true
    let addJumpForce = false;
    if (player.movement.jumping && player.onGround && player.movement.canMove && !player.movement.isSliding && player.speed > 0.1) {
        jumpedTooRecently = game.time < lastJumpTime + (gameSettings.defaultJumpDelay*1000);
        if(gameSettings.debugMode) console.log(jumpedTooRecently, " = ", game.time, "<", lastJumpTime, "+", (gameSettings.defaultJumpDelay*1000));
        if(!jumpedTooRecently){
            lastJumpTime = game.time;
            desiredMovement.addInPlace((utils.getPlayerDownDirection().scale(-1)).scale(player.jumpHeight)); // Add vertical force
            addJumpForce = true;
        }
    }
    if(player.movement.jumping)player.movement.jumping = false;

    if(player.movement.canMove && player.movement.isMoving && !player.movement.isSliding) {
        // Update lastMoveTime to game.time value
        player.lastMoveTime = game.time;

        if (player.movement.right) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camForward), player.maxVelocity);
        if (player.movement.left) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camForward.scale(-1)), player.maxVelocity);
        if (player.movement.back) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camRight.scale(-1)), player.maxVelocity);
        if (player.movement.forward) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camRight), player.maxVelocity);


        // Caps horizontal movement to the player.curMovementSpeed value (preserving y-axis forces)
        if (!desiredMovement.equals(vec3())) {
            // Set desired Y movement by saving previous desiredMovement value & scale it by the jumpForce
            let jumpForce = player.jumpHeight + gameSettings.defaultMinJumpHeight + (player.horizontalSpeed);
            let desiredJumpY = clampVector3ToMaxLength(desiredMovement.normalize().scaleInPlace(jumpForce), player.maxVelocity).y;
            desiredMovement.normalize().scaleInPlace(player.curMovementSpeed);
            // If we are adding jump force this frame... use preserved Y value
            desiredMovement.y = (addJumpForce) ? desiredJumpY : curLinearVelo.y;// Restore y-axis if jumping
        }

        // Gradual force scaling (and delay) before force gets applied to player
        moveDelayDelta = Number(moveDelayDelta.toFixed(3)); // Remove floating point precision errors
        let velocityDeltaScaled = vec3(desiredMovement.scale(moveDelayDelta>0?moveDelayDelta:0).x, desiredMovement.y, desiredMovement.scale(moveDelayDelta>0?moveDelayDelta:0).z);
        lerpedVelo = (moveDelayDelta > 0 ? velocityDeltaScaled : clampVector3ToMaxLength(curLinearVelo, player.maxVelocity));
        if(moveDelayDelta < 1)moveDelayDelta += gameSettings.defaultMoveAccelerate;

        // Quantize direction of lerpedVelo to 45-degree increments
        const angle = Math.atan2(lerpedVelo.x, lerpedVelo.z);
        const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const magnitude = lerpedVelo.length();
        finalVelocity = vec3(
            Math.sin(quantizedAngle) * magnitude,
            lerpedVelo.y, // Preserve Y component for vertical movement
            Math.cos(quantizedAngle) * magnitude
        );

    }

    // Apply speed reduction if player.tiltDegrees > gameSettings.gameSettings.defaultMaxSlopeAngle
    if(player.onGround) {
        if (player.tiltDegrees > gameSettings.defaultSlopeAngle) {
            // Handle forcing defaultMoveSpeed on slopes that are tilted greater than set in defaultSlopeAngle
            //finalVelocity = finalVelocity.normalize();//.scale(gameSettings.defaultMoveSpeed);
            player.movement.canSprint = false;
            player.movement.canJump = false;
            //if (gameSettings.debugMode) console.log("SCALING VELOCITY TO ", finalVelocity.length().toFixed(2), " BASED ON CURRENT SLOPE", player.tiltDegrees);
        } else {
            // Handle sprinting (updating curMovementSpeed value, used to scale finalVelocity value)
            if(player.movement.walking) {
                if (player.curMovementSpeed > gameSettings.defaultWalkSpeed) player.curMovementSpeed -= gameSettings.defaultMoveAccelerate;
                //if (player.curMovementSpeed < gameSettings.defaultWalkSpeed) player.curMovementSpeed += gameSettings.defaultMoveAccelerate;
            }else if(player.movement.sprinting){
                if (player.curMovementSpeed < gameSettings.defaultSprintSpeed) player.curMovementSpeed += gameSettings.defaultMoveAccelerate;
            }else{
                // Re-adjust curMovementSpeed if player was sprinting
                if(player.curMovementSpeed > gameSettings.defaultMoveSpeed) player.curMovementSpeed -= gameSettings.defaultMoveAccelerate;
                // Re-adjust curMovementSpeed if player was walking
                if(player.curMovementSpeed < gameSettings.defaultMoveSpeed) player.curMovementSpeed += gameSettings.defaultMoveAccelerate;
            }
        }
    }

    // Apply simulated friction if player's horizontalSpeed is greater than zero & player is onGround
    if(!player.movement.isMoving){
        if((player.horizontalSpeed > 0 && player.onGround) && !player.movement.isSliding){
            if(gameSettings.debugMode) console.log("Simulating friction!", player.horizontalSpeed);
            let oldYVelo = curLinearVelo.y;
            finalVelocity = new BABYLON.Vector3(curLinearVelo.x, 0, curLinearVelo.z).scale(1 - gameSettings.defaultFriction);
            finalVelocity.y = oldYVelo;
            if(finalVelocity.length() <= 0.01){
                finalVelocity = vec3(0, oldYVelo, 0);
                if(gameSettings.debugMode) console.log("Halting all player movement! finalVelocity.length() < 0.01");
            }
        }else{
            // Preserve horizontalSpeed, no friction
            finalVelocity = curLinearVelo;
        }
        // Set moveDelayDelta to negative value to add movement delay
        if(moveDelayDelta > -gameSettings.defaultMoveDelay)moveDelayDelta -= gameSettings.defaultMoveAccelerate; // Reduce value by `gameSettings.defaultMoveAccelerate` to re-enable gradual deceleration
    }

    // Limit velocity to player.maxVelocity value
    if(finalVelocity.length() > player.maxVelocity) finalVelocity = clampVector3ToMaxLength(curLinearVelo, player.maxVelocity);
    //console.log(finalVelocity.length(), clampVector3ToMaxLength(curLinearVelo, player.maxVelocity).length());

    // FINALLY, as the last step, apply the finalVelocity to our player.body.physicsImpostor
    player.body.physicsImpostor.setLinearVelocity(finalVelocity);

    // Update player `curMovementSpeed`, `movementDirection`, `horizontalSpeed`, and `speed` values with final calculated values
    //player.curMovementSpeed = Number(player.curMovementSpeed.toFixed(3)); // No longer used
    player.movementDirection = desiredMovement;
    let tempSpeed = player.body.physicsImpostor.getLinearVelocity().scale(0.99);

    player.speed = Number(tempSpeed.length().toFixed(2)); // Fix rounding errors
    player.horizontalSpeed = new BABYLON.Vector3(tempSpeed.x, 0, tempSpeed.z).length(); // Calculate and store the horizontalSpeed
}

let desiredRotation = quat(0,0,0,0);
/**
 * @desc Handles the `player.body` rotation and locks `player.body` rotation to 45 degree increments.
 * @desc Also updates the `player.mesh` rotation & position based on `player.body` rotation/position values
 * @todo Use current `camera` angle to quantize values instead, some time in the future
 */
export function handleRotationAndPosition() {
    const normalizedDirection = player.movementDirection.normalize();
    // Calculate desired Y-axis angle from `desiredMovement`, quantize to 45 deg
    let angle = Math.atan2(normalizedDirection.x, normalizedDirection.z);
    const quantizedYAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    // Get the surface normal from the ground below the player
    let surfaceNormal = utils.getSurfaceNormal(player.body, 0.5, true);if (!surfaceNormal) return;
    // Create a quaternion to align the player's body with the surface normal
    const surfaceRotation = BABYLON.Quaternion.FromLookDirectionLH(BABYLON.Vector3.Cross(vec.right.scale(-1), surfaceNormal),surfaceNormal);
    desiredRotation = surfaceRotation.multiply(BABYLON.Quaternion.FromEulerAngles(0, quantizedYAngle, 0));

    // Calculate the angle between the surface normal and Vector3.Up() vector
    const angleBetween = Math.acos(BABYLON.Vector3.Dot(surfaceNormal?.normalize(), vec.up));
    const angleDeg = BABYLON.Tools.ToDegrees(angleBetween);
    player.tiltDegrees = angleDeg;
    if(angleDeg === 0){
        if(player.movement.isSliding)player.movement.isSliding = false;
        if(!player.movement.canMove)player.movement.canMove = true;
        if(player.onGround)player.movement.canSprint = true;
    }else if(angleDeg <= gameSettings.defaultMaxSlopeAngle && angleDeg > 0){
        if(player.movement.isSliding)player.movement.isSliding = false;
        if(!player.movement.canMove)player.movement.canMove = true;
        if(player.onGround)player.movement.canSprint = true;
    }else if(angleDeg > gameSettings.defaultMaxSlopeAngle && angleDeg < 90) {
        if(!player.movement.isSliding)player.movement.isSliding = true;
        player.movement.canMove = player.movement.canSprint = player.movement.isMoving = false;
        desiredRotation = BABYLON.Quaternion.FromEulerVector(vec.up); // Override final desiredRotation to equal `vec.up`
    }

    // Apply final calculated rotationQuaternion value for the player body
    player.body.rotationQuaternion = desiredRotation.normalize();

    // Disable physicsImpostor angular velocity entirely
    player.body.physicsImpostor.setAngularVelocity(vec3());
    // Set player mesh skeleton position to prevent animations causing mesh position desync
    player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);
    // Adjust player.mesh position relative to player.body.position slightly
    player.mesh.position = vec3(player.body.position.x, player.body.position.y - (0.2 * player.scale), player.body.position.z);
    // Adjust the player mesh's rotation to slerp between its current rotation and the desired rotation (physics.body.rotationQuaternion)
    player.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(player.mesh.rotationQuaternion,player.body.rotationQuaternion,gameSettings.defaultRotationSpeed);

}
