import {game, player} from "./main.js";

let desiredMovement = BABYLON.Vector3.Zero();
let moveDelayDelta = -1;
export function handleMovement () {
    const cameraRotation = -player.camera.alpha;
    const forward = new BABYLON.Vector3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
    const right = new BABYLON.Vector3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();
    let lerpedVelo = BABYLON.Vector3.Zero(), currentVelocity = player.body.physicsImpostor.getLinearVelocity();

    // Calculate desiredMovement, quantize to 45deg increments, & apply final force to player.body
    if(player.movement.canMove && player.movement.isMoving) {
        if (player.movement.right) desiredMovement.addInPlace(forward);
        if (player.movement.left) desiredMovement.addInPlace(forward.scale(-1));
        if (player.movement.back) desiredMovement.addInPlace(right.scale(-1));
        if (player.movement.forward) desiredMovement.addInPlace(right);
        let addJumpForce = false;
        if (player.movement.onGround && player.movement.jumping) {
            desiredMovement.addInPlace((new BABYLON.Vector3.Up()).scale(player.jumpHeight)); // Add vertical force
            addJumpForce = true;
            player.movement.jumping = false;
        }

        // Caps horizontal movement to the player.curMoveSpeed value (preserving y-axis forces)
        if (!desiredMovement.equals(BABYLON.Vector3.Zero())) {
            let oldUp = desiredMovement.y;
            desiredMovement.normalize().scaleInPlace(player.curMoveSpeed);
            desiredMovement.y = (addJumpForce) ? oldUp : currentVelocity.y;// Restore y-axis if jumping
        }

        // Gradual force scaling (and delay) before force gets applied to player
        moveDelayDelta = Math.round(moveDelayDelta * 100) / 100; // Remove floating point precision errors
        let velocityDeltaScaled = new BABYLON.Vector3(desiredMovement.scale(moveDelayDelta).x, desiredMovement.y, desiredMovement.scale(moveDelayDelta).z);
        lerpedVelo = (moveDelayDelta > 0 ? velocityDeltaScaled : currentVelocity);
        if(moveDelayDelta < 1)moveDelayDelta += 0.05;

        // Quantize direction of lerpedVelo to 45-degree increments
        const angle = Math.atan2(lerpedVelo.x, lerpedVelo.z);
        const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const magnitude = lerpedVelo.length();
        lerpedVelo = new BABYLON.Vector3(
            Math.sin(quantizedAngle) * magnitude,
            lerpedVelo.y, // Preserve Y component for vertical movement
            Math.cos(quantizedAngle) * magnitude
        );

        // Apply final movement force to player.body.physicsImpostor
        player.body.physicsImpostor.setLinearVelocity(lerpedVelo);
    }

    // Simulated friction (necessary for smooth player movement otherwise)
    if(!player.movement.isMoving){
        if(player.movement.onGround && player.speed > 0){
            // If the player is on ground, isn't moving, and speed isn't quite zero...
            if (game.debugMode)console.log("Simulate friction!", player.speed);
            let curVelo = player.body.physicsImpostor.getLinearVelocity();
            let oldYVelo = curVelo.y;
            let slowerVelo = new BABYLON.Vector3(curVelo.x, oldYVelo, curVelo.z);
            player.body.physicsImpostor.setLinearVelocity(slowerVelo.scale(0.85)); // Subtract 10% from player speed per frame
        }
        // Reduces movement delay over time while not moving
        if(moveDelayDelta > -1)moveDelayDelta -= 0.05;
    }

    // Handle sprinting
    if (player.movement.sprinting && player.curMoveSpeed <= player.sprintSpeed) {player.curMoveSpeed += 0.1;}
    if (!player.movement.sprinting && player.curMoveSpeed > player.defaultMoveSpeed) {player.curMoveSpeed -= 0.1;}

    // Update player.velocity, speed, and desiredMovement values with final calculated values
    player.speed = Math.round(player.body.physicsImpostor.getLinearVelocity().length() * 100)/100;
    player.movementDirection = desiredMovement;

    // Debug movement stuff
    if (game.debugMode){
        console.log("moveDeltaDelay: ",moveDelayDelta, "movement booleans: ", player.movement);
    }
}

export function handleRotation() {
    const normalizedDirection = player.movementDirection.normalize();
    // Calculate desired angle from desiredMovement, then quantize to nearest 45 degrees
    let angle = Math.atan2(normalizedDirection.x, normalizedDirection.z);
    const quantizedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    // Create desired Y rotation quaternion based on quantized angle
    const desiredRotation = BABYLON.Quaternion.FromEulerAngles(0, quantizedAngle, 0);
    // Enforce world-aligned rotation explicitly
    player.body.rotationQuaternion.normalize();
    player.body.rotationQuaternion = desiredRotation;

    // Lock physics body rotation on X and Z axes
    // TODO: Allow minor rotation for occasion when player is on slanted surface, but limit angle
    player.body.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, player.body.physicsImpostor.getAngularVelocity().y, 0));
    player.body.physicsImpostor.angularDamping = 0;// Zero damping for instant angularVelocity value
}

export function syncMeshAndBody() {
    // Set player.mesh.skeleton pos to player.mesh pos (prevents mesh position desync during animations)
    player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);

    // Sync player.mesh rotation & position with player.body
    const rotationSpeed = 0.025;
    player.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(player.mesh.rotationQuaternion, player.body.rotationQuaternion, rotationSpeed);
    player.mesh.position = new BABYLON.Vector3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);
}