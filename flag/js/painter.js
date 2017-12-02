/**
 * Created by mangyo on 2/22/17.
 */
let container, stats;
let camera, scene, renderer;
let controls;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 15);
    camera.position.set(3, 0.15, 3);


    controls = new THREE.OrbitControls(camera);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x72645b, 2, 15);

    // Ground
    const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(40, 40),
        new THREE.MeshPhongMaterial({color: 0x999999, specular: 0x101010}));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    // scene.add(plane);
    plane.receiveShadow = true;

    // Lights
    scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
    addShadowedLight(1, 1, 1, 0xffffff, 1.35);
    addShadowedLight(0.5, 1, -1, 0xffaa00, 1);

    // renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
    renderer.setSize(800, 600);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;
    container.appendChild(renderer.domElement);

    // stats = new Stats();
    // container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);

    render();
}

function addShadowedLight(x, y, z, color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);

    const d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.bias = -0.005;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // renderer.setSize(window.innerWidth, window.innerHeight);

    // controls.handleResize();
    render();
}

function animate() {
    requestAnimationFrame(animate);
    // controls.update();// no need when not autoRotate
    render();
}

function render() {
    renderer.render(scene, camera);
    // stats.update();
}

function updateScene(msg) {
    const material = new THREE.MeshStandardMaterial({vertexColors: THREE.VertexColors, side: THREE.DoubleSide});

    ///////////////////
    const bufferGeometry = new THREE.BufferGeometry();
    if (msg.geometryTypeIsTriangular) {
        bufferGeometry.setIndex(new(msg.indices.length > 65535 ?
            THREE.Uint32BufferAttribute : THREE.Uint16BufferAttribute)
        (msg.indices, 1));
    }
    bufferGeometry.addAttribute('position',
        new THREE.Float32BufferAttribute(msg.vertices, 3));
    bufferGeometry.addAttribute('color',
        new THREE.Float32BufferAttribute(msg.colors, 3));
    if (msg.normalAttId != -1) {
        bufferGeometry.addAttribute('normal',
            new THREE.Float32BufferAttribute(msg.normals, 3));
    }
    if (msg.texCoordAttId != -1) {
        bufferGeometry.addAttribute('uv',
            new THREE.Float32BufferAttribute(msg.uvs, 2));
    }
    //////////////////////////

    let geometry;
    // Point cloud does not have face indices.
    if (bufferGeometry.index == null) {
        geometry = new THREE.Points(bufferGeometry, material);
    } else {
        bufferGeometry.computeVertexNormals();
        geometry = new THREE.Mesh(bufferGeometry, material);
    }
    // Compute range of the bufferGeometry coordinates for proper rendering.
    bufferGeometry.computeBoundingBox();
    const sizeX = bufferGeometry.boundingBox.max.x - bufferGeometry.boundingBox.min.x;
    const sizeY = bufferGeometry.boundingBox.max.y - bufferGeometry.boundingBox.min.y;
    const sizeZ = bufferGeometry.boundingBox.max.z - bufferGeometry.boundingBox.min.z;
    const diagonalSize = Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ);
    const scale = 1.0 / diagonalSize;
    const midX = (bufferGeometry.boundingBox.min.x + bufferGeometry.boundingBox.max.x) / 2;
    const midY = (bufferGeometry.boundingBox.min.y + bufferGeometry.boundingBox.max.y) / 2;
    const midZ = (bufferGeometry.boundingBox.min.z + bufferGeometry.boundingBox.max.z) / 2;

    // geometry.scale.multiplyScalar(scale);
    // geometry.position.x = -midX * scale;
    // geometry.position.y = -midY * scale;
    // geometry.position.z = -midZ * scale;
    geometry.castShadow = true;
    geometry.receiveShadow = true;

    const selectedObject = scene.getObjectByName("my_mesh");
    scene.remove(selectedObject);
    geometry.name = "my_mesh";
    scene.add(geometry);

    console.log("update scene:" + (performance.now() - msg.toMsgEnd) + "\n");
}
