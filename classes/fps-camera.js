import * as THREE from 'three';
import { KEYS } from '../constants';
import { clamp } from '../helpers/math-helper';
import { InputIOController } from "./input-io-controller";

/*
    Here is my implementation of an FPS camera which emulates the one given by Threejs library but more customizable
*/
export class FPSCamera {
    constructor(camera, objects) {
        // Initialize all properties of the camera with the IO class which helps to listen for user inputs
        this.camera_ = camera;
        this.input_ = new InputIOController();
        this.rotation_ = new THREE.Quaternion();
        this.translation_ = new THREE.Vector3(0, 2, 0);
        this.phi_ = 0;
        this.phiSpeed_ = 8;
        this.theta_ = 0;
        this.thetaSpeed_ = 5;
        // this.headBobActive_ = false;
        // this.headBobTimer_ = 0;
        this.objects_ = objects;
    }

    update(timeElapsed) {
        this.updateRotation_(timeElapsed);
        this.updateCamera_(timeElapsed);
        this.updateTranslation_(timeElapsed);
        this.input_.update(timeElapsed);
    }

    // In hear i update the camera using the rotation and translation of the instance which is affected by the user input
    updateCamera_(_) {
        this.camera_.quaternion.copy(this.rotation_);
        this.camera_.position.copy(this.translation_);
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.rotation_);

        const dir = forward.clone();

        forward.multiplyScalar(100);
        forward.add(this.translation_);

        let closest = forward;
        const result = new THREE.Vector3();
        const ray = new THREE.Ray(this.translation_, dir);
        for (let i = 0; i < this.objects_.length; i++) {
            if (ray.intersectBox(this.objects_[i], result)) {
                if (result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)) {
                    closest = result.clone();
                }
            }
        }
        this.camera_.lookAt(closest);
    }

    // I use this update translation to perform the movement of the camera and adjust the speed forward and on the sides
    updateTranslation_(timeElapsed) {
        const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
        const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(qx);
        forward.multiplyScalar(forwardVelocity * timeElapsed * 10);

        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(qx);
        left.multiplyScalar(strafeVelocity * timeElapsed * 10);

        this.translation_.add(forward);
        this.translation_.add(left);

    }

    updateRotation_(timeElapsed) {
        const xh = this.input_.current_.mouseXDelta / window.innerWidth;
        const yh = this.input_.current_.mouseYDelta / window.innerHeight;

        this.phi_ += -xh * this.phiSpeed_;
        this.theta_ = clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);
        this.rotation_.copy(q);
    }
}