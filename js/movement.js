import {game, player} from "./main.js";
import * as utils from "./utils.js";

let movementDirection = BABYLON.Vector3.Zero();
export function applyInputMovement () {
    utils.checkCanJump();// Sets player.movement.onGround, canMove, and canJump if colliding
    if (game.debugMode) console.log(player.movement);
    // Movement and jump logic
    if(player.movement.canMove) {
        let currentVelocity = player.body.physicsImpostor.getLinearVelocity();
        let newVelocity;
        if (player.movement.isMoving) {
            const cameraRotation = -player.camera.alpha;
            const forward = new BABYLON.Vector3(Math.sin(cameraRotation), 0, Math.cos(cameraRotation)).normalize();
            const right = new BABYLON.Vector3(Math.sin(cameraRotation - Math.PI / 2), 0, Math.cos(cameraRotation - Math.PI / 2)).normalize();
            let addJumpForce = false;
            if (player.movement.onGround && player.movement.jumping) {
                movementDirection.addInPlace((new BABYLON.Vector3.Up()).scale(player.jumpHeight * 250)); // Add vertical force
                addJumpForce = true;
                player.movement.jumping = false;
            }
            if (player.movement.right) movementDirection.addInPlace(forward);
            if (player.movement.left) movementDirection.addInPlace(forward.scale(-1));
            if (player.movement.back) movementDirection.addInPlace(right.scale(-1));
            if (player.movement.forward) movementDirection.addInPlace(right);

            // Scale movementDirection velocity by player.moveSpeed
            if (!movementDirection.equals(BABYLON.Vector3.Zero())) {
                movementDirection.normalize().scaleInPlace(player.moveSpeed);
            }
            newVelocity = new BABYLON.Vector3(
                movementDirection.x,
                (addJumpForce) ? movementDirection.y : currentVelocity.y,
                movementDirection.z
            );

        }else if (!player.movement.isMoving && player.speed >= 0.1) {
            currentVelocity = player.body.physicsImpostor.getLinearVelocity();
            newVelocity = currentVelocity.scale(0.975);// Reduces speed by 2.5% every frame until speed is below 0.1
        } else {
            newVelocity = BABYLON.Vector3.Zero();
        }

        // Sets player.body.physicsImposter's linearVelocity to our newly calculated Velocity value
        player.body.physicsImpostor.setLinearVelocity(newVelocity);
        player.speed = currentVelocity.length();
        player.velocity = player.speed === 0 ? BABYLON.Vector3.Zero() : newVelocity.clone().normalize();

        player.movementDirection = movementDirection;
        if (player.movement.isMoving && (!player.movement.forward && !player.movement.back && !player.movement.left && !player.movement.right)) {
            player.movement.isMoving = false;
        }
    }
}

export function applyRotation () {
    const rotationSpeed = 0.05;
    const desiredRotation = BABYLON.Quaternion.FromEulerAngles(0, Math.atan2(movementDirection.normalize().x, movementDirection.normalize().z), 0);
    const curRotation = player.body.rotationQuaternion;
    player.body.rotationQuaternion = BABYLON.Quaternion.Slerp(new BABYLON.Quaternion(0, curRotation.y, 0, curRotation.w), desiredRotation, rotationSpeed);
    // Sync mesh rotation with physics body and lock to Y-axis
    player.mesh.rotationQuaternion = player.body.rotationQuaternion;

    // Lock physics body rotation on X and Z axes
    player.body.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, player.body.physicsImpostor.getAngularVelocity().y, 0));
    player.body.physicsImpostor.angularDamping = 1;

    // Sync mesh position with physics body
    player.mesh.skeleton.bones[0].getTransformNode().setAbsolutePosition(player.mesh.position);
    player.mesh.position = new BABYLON.Vector3(player.body.position.x, player.body.position.y - 0.2, player.body.position.z);
}