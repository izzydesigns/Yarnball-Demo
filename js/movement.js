import {game, gameSettings, player} from "./main.js";
import * as utils from "./utils.js";
import {clampVector3ToMaxLength, quat, vec, vec3} from "./utils.js";

let desiredMovement = vec3(), moveDelayDelta = 0;
/**
 * @desc Handles the player movement and applies forces to the `player.body` based on desired direction.
 * @desc Determines which direction and how strong the force is based on factors like `gameSettings.maxDefaultMoveSpeed
 */
export function handleMovement () {
    const cameraRotation = -player.camera.alpha; // Negative value because we're in third person and we want the forward direction
    const camForward = utils.vec3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
    const camRight = utils.vec3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();
    let lerpedVelo = vec3(), curLinearVelo = player.body.physicsImpostor.getLinearVelocity();
    let finalVelocity = vec3();
    player.curLookDirection = player.camera.getDirection(player.body.position);
    player.prevSpeed = player.speed; // Update player.prevSpeed before absoluteSpeed gets updated

    // Check & sets canMove, canJump and onGround = true if rayCast below player = true (is colliding below)
    let onGroundCheck = utils.checkCanJump(0.2 + 0.05/* Half player height (+ buffer for slopes) */);
    // Set onGround, canJump, and canSprint to true if the onGroundCheck.hit returns a value
    player.onGround = player.movement.canJump = player.movement.canSprint = onGroundCheck.hit;

    // Handles jump force calculation & sets movement.jumping back to false
    let addJumpForce = false;
    if (player.movement.canMove && player.onGround && player.movement.jumping && !player.movement.isSliding) {
        desiredMovement.addInPlace((utils.getPlayerDownDirection().scale(-1)).scale(player.jumpHeight)); // Add vertical force
        addJumpForce = true;
        player.movement.jumping = false;
    }

    if(player.movement.canMove && player.movement.isMoving && !player.movement.isSliding) {
        // Update lastMoveTime to game.time value
        player.lastMoveTime = game.time;

        if (player.movement.right) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camForward), gameSettings.defaultMaxVelocity);
        if (player.movement.left) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camForward.scale(-1)), gameSettings.defaultMaxVelocity);
        if (player.movement.back) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camRight.scale(-1)), gameSettings.defaultMaxVelocity);
        if (player.movement.forward) desiredMovement = clampVector3ToMaxLength(desiredMovement.addInPlace(camRight), gameSettings.defaultMaxVelocity);


        // Caps horizontal movement to the player.curMovementSpeed value (preserving y-axis forces)
        if (!desiredMovement.equals(vec3())) {
            // Set desired Y movement by saving previous desiredMovement value & scale it by the jumpForce
            let jumpForce = player.jumpHeight + gameSettings.defaultMinJumpHeight + (player.absoluteSpeed);
            let desiredJumpY = clampVector3ToMaxLength(desiredMovement.normalize().scaleInPlace(jumpForce), gameSettings.defaultMaxVelocity).y;
            desiredMovement.normalize().scaleInPlace(player.curMovementSpeed);
            // If we are adding jump force this frame... use preserved Y value
            desiredMovement.y = (addJumpForce) ? desiredJumpY : curLinearVelo.y;// Restore y-axis if jumping
        }

        // Gradual force scaling (and delay) before force gets applied to player
        moveDelayDelta = Number(moveDelayDelta.toFixed(3)); // Remove floating point precision errors
        let velocityDeltaScaled = utils.vec3(desiredMovement.scale(moveDelayDelta>0?moveDelayDelta:0).x, desiredMovement.y, desiredMovement.scale(moveDelayDelta>0?moveDelayDelta:0).z);
        lerpedVelo = (moveDelayDelta > 0 ? velocityDeltaScaled : clampVector3ToMaxLength(curLinearVelo, gameSettings.defaultMaxVelocity));
        if(moveDelayDelta < 1)moveDelayDelta += gameSettings.defaultMoveAccelerate;

        // Quantize direction of lerpedVelo to 45-degree increments
        const angle = Math.atan2(lerpedVelo.x, lerpedVelo.z);
        const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const magnitude = lerpedVelo.length();
        finalVelocity = utils.vec3(
            Math.sin(quantizedAngle) * magnitude,
            lerpedVelo.y, // Preserve Y component for vertical movement
            Math.cos(quantizedAngle) * magnitude
        );

    }

    // Apply absoluteSpeed reduction if player.tiltDegrees > gameSettings.gameSettings.defaultMaxSlopeAngle
    if(player.onGround) {
        if (player.tiltDegrees > gameSettings.defaultSteepAngle) {
            // Handle forcing defaultMoveSpeed on slopes that are tilted greater than set in defaultSteepAngle
            finalVelocity = finalVelocity.normalize();//.scale(gameSettings.defaultMoveSpeed);
            //player.movement.canSprint = false;
            player.movement.canJump = false;
            if (gameSettings.debugMode) console.log("SCALING VELOCITY TO ", finalVelocity.length().toFixed(2), " BASED ON CURRENT SLOPE", player.tiltDegrees);
        } else {
            // Handle sprinting (updating curMovementSpeed value, used to scale finalVelocity value)
            if (player.movement.sprinting && player.movement.canSprint) {
                if (player.curMovementSpeed <= player.sprintSpeed) {player.curMovementSpeed += gameSettings.defaultMoveAccelerate;}
            } else {
                if (player.curMovementSpeed > gameSettings.defaultMoveSpeed) {player.curMovementSpeed -= gameSettings.defaultMoveAccelerate;}
            }
        }
    }

    if(!player.movement.isMoving){
        // Apply simulated friction if player's absoluteSpeed is greater than zero & player is onGround
        if((player.absoluteSpeed > 0 && player.onGround) && !player.movement.isSliding){
            if(gameSettings.debugMode) console.log("Simulating friction!", player.absoluteSpeed);
            let oldYVelo = curLinearVelo.y;
            finalVelocity = new BABYLON.Vector3(curLinearVelo.x, oldYVelo, curLinearVelo.z).scale(1 - gameSettings.defaultFriction);
        }else{
            //console.log("Preserve absoluteSpeed, no friction");
            //console.log("Speed?", player.absoluteSpeed, "onGround?", player.movement.onGround);
            finalVelocity = curLinearVelo;
        }
        // Set moveDelayDelta to negative value to add movement delay
        if(moveDelayDelta > gameSettings.defaultMoveDelay)moveDelayDelta -= gameSettings.defaultMoveAccelerate; // Reduce value by `gameSettings.defaultMoveAccelerate` to re-enable gradual deceleration
    }
    if(finalVelocity.y < gameSettings.defaultGravity.y){
        console.log(finalVelocity.y, gameSettings.defaultGravity.y);
        finalVelocity.y = gameSettings.defaultGravity.y;
    }

    // Update player `curMovementSpeed`, `movementDirection`, and `absoluteSpeed` values with final calculated values
    player.curMovementSpeed = Number(player.curMovementSpeed.toFixed(3)); // Fix rounding errors
    player.movementDirection = desiredMovement;
    let tempSpeed = player.body.physicsImpostor.getLinearVelocity().scale(0.99);

    player.speed = Number(tempSpeed.length().toFixed(2)); // Fix rounding errors
    player.absoluteSpeed = Number(new BABYLON.Vector3(tempSpeed.x, 0, tempSpeed.z).length().toFixed(2)); // Calculate and store the horizontal absoluteSpeed
    //console.log(player.speed, player.absoluteSpeed);

    // FINALLY, as the last step, apply the finalVelocity to our player.body.physicsImpostor
    player.body.physicsImpostor.setLinearVelocity(finalVelocity);
}

let desiredRotation = quat(0,0,0,0);
/**
 * @desc Handles the `player.body` rotation and locks `player.body` rotation to 45 degree increments.
 * @desc Also updates the `player.mesh` rotation & position based on `player.body` rotation/position values
 * @todo Use current `camera` angle to quantize values instead, some time in the future
 */
export function handleRotationAndPosition() {
    let getCurVelo = player.body.physicsImpostor.getAngularVelocity();
    const normalizedDirection = player.movementDirection.normalize();
    // Calculate desired Y-axis angle from `desiredMovement`, quantize to 45 deg
    let angle = Math.atan2(normalizedDirection.x, normalizedDirection.z);
    const quantizedYAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

    // Get the surface normal from the ground below the player
    let surfaceNormal = utils.getSurfaceNormal(player.body, 0.5, true);if (!surfaceNormal) return;
    // Calculate the angle between the surface normal and Vector3.Up() vector
    const angleBetween = Math.acos(BABYLON.Vector3.Dot(surfaceNormal.normalize(), vec.up));
    const angleDeg = BABYLON.Tools.ToDegrees(angleBetween);
    player.tiltDegrees = angleDeg;
    if(angleDeg <= gameSettings.defaultMaxSlopeAngle && angleDeg !== 0){
        player.movement.isSliding = false;
        player.movement.canMove = true;
        if(player.onGround)player.movement.canSprint = true;
        //if(gameSettings.debugMode)console.log("using surface normal for desiredrotation ⚠️: angleDeg =",angleDeg);
    }else if(angleDeg > gameSettings.defaultMaxSlopeAngle) {
        player.movement.isSliding = true;
        player.movement.canMove = false;
        player.movement.canSprint = false;
        player.movement.isMoving = false;
        //if(gameSettings.debugMode)console.log("ON STEEP SURFACE 🛑: isSliding =",player.movement.isSliding);
    }else if(angleDeg === 0){
        player.movement.isSliding = false;
        player.movement.canMove = true; // TODO: this is bad, redo this later somehow
        //if(gameSettings.debugMode)console.log("using default up direction for rotation ✅: angleDeg =",angleDeg);
    }
    //console.log("canSprint?",player.movement.canSprint);
    // Create a quaternion to align the player's body with the surface normal
    const surfaceRotation = BABYLON.Quaternion.FromLookDirectionLH(BABYLON.Vector3.Cross(vec.right.scale(-1), surfaceNormal),surfaceNormal);
    desiredRotation = surfaceRotation.multiply(BABYLON.Quaternion.FromEulerAngles(0, quantizedYAngle, 0));
    // Apply calculated rotationQuaternion value for player.body
    player.body.rotationQuaternion = desiredRotation.normalize();

    // Lock physics body rotation on X and Z axes by preserving the Y angular velocity
    player.body.physicsImpostor.setAngularVelocity(utils.vec3(0, getCurVelo?.y || 0, 0));
    // Set player mesh skeleton position to prevent animations causing mesh position desync
    player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);
    // Adjust player.mesh position relative to player.body.position slightly
    player.mesh.position = vec3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);
    // Adjust the player mesh's rotation to slerp between its current rotation and the desired rotation (physics.body.rotationQuaternion)
    player.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(player.mesh.rotationQuaternion,player.body.rotationQuaternion,gameSettings.defaultRotationSpeed);

    //utils.createTrajectoryLines(player.body);
}
