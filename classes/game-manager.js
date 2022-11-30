import * as THREE from 'three'
import { FPSCamera } from "./fps-camera";
import threeFbxLoader, * as FBXLoader from 'three-fbx-loader'
import { Bullet } from './bullet';

export class GameManager {
    constructor() {
        this.initialize_();
    }
    initialize_() {
        this.objectsInScene = {};
        this.soundFX = {};
        this.collidableMeshList = [];
        this.bullets = [];
        this.initializeRenderer_();
        this.initializeLights_();
        this.initializeScene_();
        this.initializePostFX_();
        this.initializeGame_();
        this.previousRAF_ = null;
        this.raf_();
        this.onWindowResize_();
    }

    initializeGame_() {
        this.fpsCamera_ = new FPSCamera(this.camera_, this.objects_);
    }

    initializeRenderer_() {
        this.threejs_ = new THREE.WebGL1Renderer({
            antialias: false,
        });
        this.threejs_.shadowMap.enabled = true;
        this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threejs_.setPixelRatio(window.devicePixelRatio);
        this.threejs_.setSize(window.innerWidth, window.innerHeight);
        this.threejs_.physicallyCorrectLights = true;
        this.threejs_.outputEncoding = THREE.sRGBEncoding;

        document.body.appendChild(this.threejs_.domElement);

        window.addEventListener('resize', () => {
            this.onWindowResize_();
        }, false);

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera_.position.set(0, 2, 0);

        this.scene_ = new THREE.Scene();

        this.uiCamera_ = new THREE.OrthographicCamera(-1, 1, 1 * aspect, -1 * aspect, 1, 1000);

        this.uiScene_ = new THREE.Scene();
    }

    initializeScene_() {
        const loader = new THREE.CubeTextureLoader();

        //https://opengameart.org/content/space-skyboxes-1
        const texture = loader.load([
            './skybox/1.png',
            './skybox/2.png',
            './skybox/3.png',
            './skybox/4.png',
            './skybox/5.png',
            './skybox/6.png',
        ]);
        texture.encoding = THREE.sRGBEncoding;
        this.scene_.background = texture;

        // chess tile map
        const mapLoader = new THREE.TextureLoader();
        const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();
        const checkerboard = mapLoader.load('tile.png');
        checkerboard.anisotropy = maxAnisotropy;
        checkerboard.wrapS = THREE.RepeatWrapping;
        checkerboard.wrapT = THREE.RepeatWrapping;
        checkerboard.repeat.set(32, 32);
        checkerboard.encoding = THREE.sRGBEncoding;

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.MeshStandardMaterial({ map: checkerboard })
        );
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene_.add(plane);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(4, 20, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box.position.set(10, 2, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene_.add(box);
        this.collidableMeshList.push(box);

        const box2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box2.position.set(25, 2, 0);
        box2.castShadow = true;
        box2.receiveShadow = true;
        this.scene_.add(box2);
        this.collidableMeshList.push(box2);

        const box3 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 10, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box3.position.set(-23, 2, 0);
        box3.castShadow = true;
        box3.receiveShadow = true;
        this.scene_.add(box3);
        this.collidableMeshList.push(box3);



        const box4 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 10, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box4.position.set(20, 2, 20);
        box4.castShadow = true;
        box4.receiveShadow = true;
        this.scene_.add(box4);
        this.collidableMeshList.push(box4);


        const box5 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box5.position.set(15, 2, -20);
        box5.castShadow = true;
        box5.receiveShadow = true;
        this.scene_.add(box5);
        this.collidableMeshList.push(box5);

        const box6 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 10, 4),
            this.loadMaterial_('space-cruiser-panels2_', 0.2)
        );
        box6.position.set(15, 2, 40);
        box6.castShadow = true;
        box6.receiveShadow = true;
        this.scene_.add(box6);
        this.collidableMeshList.push(box6);

        const fbxLoader = new FBXLoader();


        let playerGeo = new THREE.SphereGeometry(0.7);
        const stand = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
        const player = new THREE.Mesh(
            playerGeo,
            stand
        );
        player.name = "player";
        this.scene_.add(player);
        // this.collidableMeshList.push(player);
        this.objectsInScene.player = player;

        let bulletGeo = new THREE.SphereGeometry(0.25);
        const bullet = new THREE.Mesh(
            bulletGeo,
            this.loadMaterial_('plasticpattern1-', 0.2)
        );
        // this.scene_.add(bullet);
        this.objectsInScene.bullet = bullet;
        this.objectsInScene.bulletVelocity = new THREE.Vector3();


        // for(let i = 0; i < 6; i++){

        // }
        let enemyGeo = new THREE.BoxGeometry(2, 6, 2);
        const enemy = new THREE.Mesh(
            enemyGeo,
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        )
        enemy.position.set(10, 2, 0);
        this.scene_.add(enemy);
        this.objectsInScene.enemy = enemy;

        let enemy2Geo = new THREE.BoxGeometry(2, 6, 2);
        const enemy2 = new THREE.Mesh(
            enemy2Geo,
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        )
        enemy2.position.set(20, 2, 15);
        this.scene_.add(enemy2);
        this.objectsInScene.enemy2 = enemy2;

        const raycaster = new THREE.Raycaster();
        const search = [];
        const lag = 0.2;
        this.objectsInScene.enemy.lag = lag;
        this.objectsInScene.enemy.raycaster = raycaster;
        this.objectsInScene.enemy2.lag = lag;
        this.objectsInScene.enemy2.raycaster = raycaster;
        for (let i = 0; i < 360; i += 3) {
            search[i] = new THREE.Vector3(Math.cos(i), 0, Math.sin(i));
        }
        this.objectsInScene.enemy.searcharr = search;
        this.objectsInScene.enemy2.searcharr = search;

        const industrialMaterial = this.loadMaterial_('industrial-walls_', 4);

        const wall1 = new THREE.Mesh(
            new THREE.BoxGeometry(100, 100, 4),
            industrialMaterial
        );
        wall1.position.set(0, -40, -50);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        this.scene_.add(wall1);
        this.collidableMeshList.push(wall1);

        const wall2 = new THREE.Mesh(
            new THREE.BoxGeometry(100, 100, 4),
            industrialMaterial
        );
        wall2.position.set(0, -40, 50);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        this.scene_.add(wall2);
        this.collidableMeshList.push(wall2);

        const wall3 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 100, 100),
            industrialMaterial
        );
        wall3.position.set(50, -40, 0);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        this.scene_.add(wall3);
        this.collidableMeshList.push(wall3);

        const wall4 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 100, 100),
            industrialMaterial
        );
        wall4.position.set(-50, -40, 0);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        this.scene_.add(wall4);
        this.collidableMeshList.push(wall4);

        const meshes = [
            plane, box, wall1, wall2, wall3, wall4
        ]
        this.objects_ = [];

        for (let i = 0; i < meshes.length; i++) {
            const b = new THREE.Box3();
            b.setFromObject(meshes[i]);
            this.objects_.push(b);
        }

        //crosshair initialization
        const crosshair = mapLoader.load('crosshair1.png');
        crosshair.anisotropy = maxAnisotropy;

        this.sprite_ = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: crosshair,
                color: 0xffffff,
                fog: false,
                depthTest: false,
                depthWrite: false
            })
        );
        this.sprite_.scale.set(0.15, 0.15 * this.camera_.aspect, 1);
        this.sprite_.position.set(0, 0, -10);
        this.uiScene_.add(this.sprite_);

    }

    initializeLights_() {
        // const gui = new dat.GUI();
        const distance = 50.0;
        const angle = Math.PI / 4.0;
        const penumbra = 0.5;
        const decay = 1.0;

        let light = new THREE.SpotLight(
            0xFFFFFFF, 100.0, distance, angle, penumbra, decay
        );
        light.castShadow = true;
        light.shadow.bias = -0.00001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 100;

        light.position.set(25, 25, 0);
        light.lookAt(0, 0, 0);
        this.scene_.add(light);

        const upColour = 0xFFFF80;
        const downColour = 0x808080;
        light = new THREE.HemisphereLight(upColour, downColour, 0.5);
        // light.intensity = 1.5;
        light.color.setHSL(0.6, 1, 0.6);
        light.groundColor.setHSL(0.095, 1, 0.75);
        light.position.set(0, 4, 0);
        this.scene_.add(light);
    }

    loadMaterial_(name, tiling) {
        const mapLoader = new THREE.TextureLoader();
        const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();

        const metalMap = mapLoader.load('textures/' + name + 'metallic.png');
        metalMap.anisotropy = maxAnisotropy;
        metalMap.wrapS = THREE.RepeatWrapping;
        metalMap.wrapT = THREE.RepeatWrapping;
        metalMap.repeat.set(tiling, tiling);

        const albedo = mapLoader.load('textures/' + name + 'albedo.png');
        albedo.anisotropy = maxAnisotropy;
        albedo.wrapS = THREE.RepeatWrapping;
        albedo.wrapT = THREE.RepeatWrapping;
        albedo.repeat.set(tiling, tiling);
        albedo.encoding = THREE.sRGBEncoding;

        const normalMap = mapLoader.load('textures/' + name + 'normal-dx.png');
        normalMap.anisotropy = maxAnisotropy;
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(tiling, tiling);

        const roughnessMap = mapLoader.load('textures/' + name + 'roughness.png');
        roughnessMap.anisotropy = maxAnisotropy;
        roughnessMap.wrapS = THREE.RepeatWrapping;
        roughnessMap.wrapT = THREE.RepeatWrapping;
        roughnessMap.repeat.set(tiling, tiling);

        const material = new THREE.MeshStandardMaterial({
            metalnessMap: metalMap,
            map: albedo,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
        });

        return material;

    }

    initializePostFX_() {
        let enableSound = false;
        const listener = new THREE.AudioListener();
        this.camera_.add(listener);

        const audioLoader = new THREE.AudioLoader();

        const backgroundSound = new THREE.Audio(listener);

        audioLoader.load('../mainSoundtrack.mp3', function (buffer) {
            backgroundSound.setBuffer(buffer);
            backgroundSound.setLoop(true);
            backgroundSound.setVolume(0.2);
            enableSound = true;
            // backgroundSound.play()
        });
        const blasterSound = new THREE.Audio(listener);
        audioLoader.load('../blasterSfx.mp3', function (buffer) {
            blasterSound.setBuffer(buffer);
            blasterSound.setVolume(0.4);
        })
        this.soundFX.blasterSound = blasterSound;
        window.addEventListener('mousemove', (e) => {
            if (enableSound) {
                backgroundSound.play();
                enableSound = false;
            }
        })
    }

    onWindowResize_() {
        this.camera_.aspect = window.innerWidth / window.innerHeight;
        this.camera_.updateProjectionMatrix();

        this.uiCamera_.left = -this.camera_.aspect;
        this.uiCamera_.right = this.camera_.aspect;
        this.uiCamera_.updateProjectionMatrix();

        this.threejs_.setSize(window.innerWidth, window.innerHeight);
    }

    raf_() {
        requestAnimationFrame((f) => {
            if (this.previousRAF_ === null) {
                this.previousRAF_ = f;
            }

            let xAxis = new THREE.Vector3();
            let yAxis = new THREE.Vector3();
            let zAxis = new THREE.Vector3();
            this.camera_.matrix.extractBasis(xAxis, yAxis, zAxis);
            this.objectsInScene.player.position.copy(this.camera_.position);
            this.objectsInScene.player.position.addScaledVector(zAxis, -4.0);
            this.objectsInScene.player.position.addScaledVector(yAxis, -2.0);
            this.checkForPlayer_();
            this.step_(f - this.previousRAF_);
            this.threejs_.autoClear = true;
            this.objectsInScene.bullet.position.add(this.objectsInScene.bulletVelocity);
            this.threejs_.render(this.scene_, this.camera_);
            this.threejs_.autoClear = false;
            this.threejs_.render(this.uiScene_, this.uiCamera_);
            this.previousRAF_ = f;
            this.raf_();
        });
    }

    step_(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case "Space":
                    let blasterfx = this.soundFX.blasterSound
                    blasterfx.play();
                    let newBullet = new Bullet(this.objectsInScene.bullet);
                    newBullet.alive = true;
                    setTimeout(function () {
                        newBullet.alive = false;
                        // blasterfx.stop();
                    }, 1000)
                    this.objectsInScene.bullet.position.copy(this.objectsInScene.player.position);

                    let xAxis = new THREE.Vector3();
                    let yAxis = new THREE.Vector3();
                    let zAxis = new THREE.Vector3();
                    this.camera_.matrix.extractBasis(xAxis, yAxis, zAxis);

                    this.objectsInScene.bulletVelocity.copy(zAxis);
                    this.objectsInScene.bulletVelocity.addScaledVector(zAxis, -2.0);
                    this.scene_.add(this.objectsInScene.bullet);
                    break;
            }
        })

        let meshGeo = this.objectsInScene.player.geometry.getAttribute('position');
        const vertx = new THREE.Vector3();
        let originPoint = this.objectsInScene.player.position.clone();
        // console.log(meshGeo, 'Player vertex')

        for (let vertexIndex = 0; vertexIndex < meshGeo.count; vertexIndex++) {
            let localVertex = vertx.fromBufferAttribute(meshGeo, vertexIndex);
            let globalVertex = localVertex.applyMatrix4(this.objectsInScene.player.matrix);
            let directionVertex = globalVertex.sub(this.objectsInScene.player.position);
            let ray = new THREE.Raycaster(originPoint, directionVertex.clone().normalize());
            let collisionResults = ray.intersectObjects(this.collidableMeshList);
            if (collisionResults.length > 0 && collisionResults[0].distance < directionVertex.length()) {
                console.log('player collision hit')
            }
        }
        let bulletGeo = this.objectsInScene.bullet.geometry.getAttribute('position');
        const bVertx = new THREE.Vector3();
        let bOriginPoint = this.objectsInScene.bullet.position.clone();

        for (let vertexIndex = 0; vertexIndex < bulletGeo.count; vertexIndex++) {
            let localVertex = bVertx.fromBufferAttribute(bulletGeo, vertexIndex);
            let globalVertex = localVertex.applyMatrix4(this.objectsInScene.bullet.matrix);
            let directionVertex = globalVertex.sub(this.objectsInScene.bullet.position);
            let ray = new THREE.Raycaster(bOriginPoint, directionVertex.clone().normalize());
            let collisionResults = ray.intersectObjects(this.collidableMeshList);
            if (collisionResults.length > 0 && collisionResults[0].distance < directionVertex.length()) {

                console.log('bullet collision hit')
            }
        }
        this.fpsCamera_.update(timeElapsedS);
    }

    checkForPlayer_() {
        this.objectsInScene.enemy.searcharr.forEach((direction) => {
            this.objectsInScene.enemy.raycaster.set(this.objectsInScene.enemy.position, direction, 0, 50);
            const intersects = this.objectsInScene.enemy.raycaster.intersectObjects(this.scene_.children, false);

            if (intersects[0].object.name) {
                this.objectsInScene.enemy.position.x += (direction.x * 0.05);
                this.objectsInScene.enemy.position.y += (direction.y * 0.05);
                this.objectsInScene.enemy.position.z += (direction.z * 0.05)
            }
        })
    }
}