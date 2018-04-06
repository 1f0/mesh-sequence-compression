"use strict";
// all for show the mesh, interface with three.js

"use strict";

var G = G || {}

G.Viewer = function (options) {
    this.rotate = false;
    this.wireframe = false;
    this.orgX = 0;
    this.orgY = 0;
    this.lastTime = 0;
    this.lastFrames = 0;
    this.currentFrames = 0;
    this.fps = 0;
    this.filename = "";
    this.meshes = [];
    this.colors = [];
    this.models = [];
    this.init(options);
};

G.Viewer.prototype.init = function (options) {
    this.options = options || {};
    this.width = options.width || 360;
    this.height = options.height || 360;
    this.dropable = options.dropable || false;
    this.backgroundColor = options.backgroundColor || 0x101010;
    this.defaultMaterialColor = options.materialColor || 0xcccccc;
    this.scene = new THREE.Scene();
    this.material = new THREE.MeshLambertMaterial({
        color: this.materialColor,
        wireframe: this.wireframe
    });

    this.initCanvas();
    this.initCamera();
    this.initLighting();
    this.initRenderer();
    this.initColors();

    this.bindEvent();
    this.setStatus({
        status: "idle"
    });
};

G.Viewer.prototype.initCanvas = function () {
    var id = Math.floor(Math.random() * 1e7 + 1);
    this.container = this.options.container ? $("#" + this.options.container) : null;
    if (!this.container) {
        document.write('<div id = "container_' + id + '"></div>');
        this.container = $("#container_" + id);
    }
    this.container.attr("tabindex", id).css({
        position: "relative",
        width: this.width,
        height: this.height,
        margin: "8px 0"
    });
    this.$canvas3d = $("<canvas></canvas>").css({
        width: this.width,
        height: this.height,
        position: "absolute",
        left: 0,
        top: 0
    }).appendTo(this.container);
    this.$canvas2d = $("<canvas></canvas>").css({
        width: this.width,
        height: this.height,
        "background-color": "transparent",
        "z-index": 9,
        position: "absolute",
        left: 0,
        top: 0
    }).appendTo(this.container);
};

G.Viewer.prototype.initLighting = function () {
    this.light1 = new THREE.PointLight(16777215);
    this.light1.position.set(-10, 10, 50);
    this.light2 = new THREE.PointLight(16777215);
    this.light2.position.set(10, -10, -50);
    this.scene.add(this.light1);
    this.scene.add(this.light2);

    //var ambient = new THREE.AmbientLight(0x404040);
    //this.scene.add(ambient);
};

G.Viewer.prototype.initRenderer = function () {
    if ("WebGLRenderingContext" in window) this.renderer = new THREE.WebGLRenderer({
        canvas: this.$canvas3d.get(0),
        antialias: true
    });
    else this.renderer = new THREE.CanvasRenderer({
        canvas: this.$canvas3d.get(0)
    });
    this.renderer2D = new THREE.CanvasRenderer({
        canvas: this.$canvas2d.get(0)
    });
    this.renderer.setClearColor(new THREE.Color(this.backgroundColor));
    this.renderer.setSize(this.width, this.height);
    this.renderer2D.setSize(this.width, this.height);
};

G.Viewer.prototype.drawInfo = function (ctx2d) {
    var x = this.width / 2;
    var y = this.height / 2;
    ctx2d.font = "9pt Calibri";
    ctx2d.fillStyle = "#FFFFFF";
    ctx2d.textAlign = "center";
    var text = "";
    var vertices = 0;
    var faces = 0;
    var polygons = 0;
    var holes = 0;
    var self = this;
    $.each(this.models, function (index, model) {
        if (model instanceof G.Model) {
            vertices += model.vs.length;
            faces += model.fs.length;
        } else if (model instanceof G.Polygon) {
            polygons++;
            holes += model.ins.length;
            vertices += model.out.vs.length;
            $.each(model.ins, function (index, pc) {
                vertices += pc.vs.length;
            });
        }
    });
    if (vertices > 0) text += " V:" + vertices;
    if (faces > 0) text += " F:" + faces;
    if (polygons > 0) text += " P:" + polygons;
    if (holes > 0) text += " H:" + holes;
    if (this.wireframe) text += " wireframe";
    ctx2d.fillText(text, x, 15);
    ctx2d.fillText(this.filename, x, this.height - 8);
    if (this.animation) {
        var now = new Date;
        var mms = now - this.lastTime;
        if (mms > 500) {
            this.fps = Math.round(1e3 * (this.currentFrames - this.lastFrames) / mms);
            this.lastFrames = this.currentFrames;
            this.lastTime = now;
        }
        ctx2d.textAlign = "left";
        ctx2d.fillText("fps:" + this.fps + "/60", 5, 15);
    }
};

G.Viewer.prototype.render = function () {
    var ctx2d = this.renderer2D.domElement.getContext("2d");
    ctx2d.clearRect(0, 0, this.width, this.height);
    var x = this.width / 2;
    var y = this.height / 2;
    if (this.status === "idle") {
        if (this.dropable) {
            ctx2d.font = "24pt Calibri";
            ctx2d.textAlign = "center";
            ctx2d.fillStyle = "#FFFFFF";
            ctx2d.fillText("File", x, y - 10);
            ctx2d.font = "12pt Calibri";
            ctx2d.fillText("Format: obj", x, y + 20)
        }
    } else if (this.status === "parsing" || this.status === "loading") {
        ctx2d.beginPath();
        ctx2d.rect(0, 0, this.progress * this.width / 100, 4);
        ctx2d.fillStyle = this.status === "loading" ? "#CD332D" : "#76B900";
        ctx2d.fill();
    } else if (this.status === "loaded") {
        this.drawInfo(ctx2d);
    }
    this.renderer.render(this.scene, this.camera);
};

G.Viewer.prototype.animate = function () {
    if (!this.animation) {
        this.currentFrames = this.lastFrames = 0;
        this.lastTime = 0;
        return;
    }
    if (this.rotating) {
        this.rotateMeshes(0, 0.01);
    }
    this.render();
    this.currentFrames++;
    requestAnimationFrame(this.animate.bind(this));
};

G.Viewer.prototype.bindEvent = function () {
    this.container.get(0).addEventListener("mousedown", this.mouseDownHandler.bind(this), false);
    this.container.get(0).addEventListener("mouseup", this.mouseUpHandler.bind(this), false);
    this.container.get(0).addEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
    this.container.get(0).addEventListener("DOMMouseScroll", this.mouseWheelHandler.bind(this), false);
    this.container.get(0).addEventListener("mousewheel", this.mouseWheelHandler.bind(this), false);
    $(this.container).keydown(this.keyDownHandler.bind(this));
    $(this.container).mouseout(this.mouseoutHandler.bind(this));
};

G.Viewer.prototype.loadedHandler = function () {
    this.setStatus({status: "loaded"});
    this.addModel(this.model);
    this.resetCamera();
    this.render()
};

G.Viewer.prototype.setStatus = function (status) {
    this.status = status.status;
    this.progress = status.progress;
    this.render();
};

G.Viewer.prototype.removeAllModels = function () {
    $.each(this.models, function (index, model) {
        model.dispose();
    });
    this.models = [];
};

G.Viewer.prototype.addModels = function (models) {
    for (var i = 0; i < models.length; i++) this.addModel(models[i]);
};

G.Viewer.prototype.addModel = function (model) {
    this.models.push(model);
    var start = new Date();
    var geometry = model.toTHREEGeometry();

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var model_color = this.colors[(this.models.length - 1) % this.colors.length];
    var material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(model_color),
        wireframe: this.wireframe
    });
    material.side = THREE.DoubleSide;

    //!Todo remove this in future
    material.vertexColors = THREE.VertexColors;

    var mesh = new THREE.Mesh(geometry, material);
    console.log("G.Viewer bufferGeometry/mesh built in " + (new Date - start) + "ms");
    this.addMesh(mesh);
    return this;
};

G.Viewer.prototype.addMesh = function (mesh) {
    this.meshes.push(mesh);
    this.scene.add(mesh);
    this.render();
    return this;
};

G.Viewer.prototype.removeAllMeshes = function () {
    var self = this;
    $.each(this.meshes, function (index, mesh) {
        self.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    this.meshes = [];
    this.render();
    return this;
};

G.Viewer.prototype.resetMeshes = function () {
    $.each(this.meshes, function (index, mesh) {
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
    });
    return this;
};

G.Viewer.prototype.moveMeshes = function (dx, dy) {
    $.each(this.meshes, function (index, mesh) {
        mesh.position.x += dx;
        mesh.position.y += dy;
    });
    return this;
};

G.Viewer.prototype.rotateMeshes = function (dx, dy) {
    $.each(this.meshes, function (index, mesh) {
        mesh.rotation.x += dx;
        mesh.rotation.y += dy;
    });
    return this;
};

G.Viewer.prototype.toggleWireframe = function () {
    if (this.meshes.length === 0) return;
    this.wireframe = !this.wireframe;
    var self = this;
    $.each(this.meshes, function (index, mesh) {
        mesh.material.wireframe = self.wireframe;
    });
    return this;
};

G.Viewer.prototype.initCamera = function () {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, .1, 1e4);
    if (this.scene) this.scene.add(this.camera);
    this.resetCamera();
    return this;
};

G.Viewer.prototype.resetCamera = function () {
    if (this.camera) this.camera.position.z = 3;
    return this;
};

G.Viewer.prototype.zoomCamera = function (factor) {
    if (this.camera) this.camera.position.z *= factor;
    return this;
};

G.Viewer.prototype.initColors = function () {
    this.colors = new Array(16);
    this.randomColors();
    if (this.defaultMaterialColor) this.colors[0] = this.defaultMaterialColor;
};

G.Viewer.prototype.randomColors = function () {
    while (this.colors.length < this.meshes.length) this.colors.push(0);
    for (var i = 0; i < this.colors.length; i++) this.colors[i] = Math.floor(Math.random() * 16777215);
    for (var i = 0; i < this.meshes.length; i++) this.meshes[i].material.color.setHex(this.colors[i % this.colors.length]);
};

G.Viewer.prototype.keyDownHandler = function (e) {
    e.stopPropagation();
    var key = e.keyCode || e.which;
    switch (key) {
        case 38://up arrow
            this.moveMeshes(0, .02);
            break;
        case 40://down
            this.moveMeshes(0, -.02);
            break;
        case 37://left
            this.moveMeshes(-.02, 0);
            break;
        case 39://right
            this.moveMeshes(.02, 0);
            break;
        case 219://open bracket
            this.zoomCamera(10 / 9);
            break;
        case 221://close
            this.zoomCamera(.9);
            break;
        case 67://c
            this.randomColors();
            break;
        case 87://w
            this.toggleWireframe();
            break;
        case 82://r
            this.resetCamera();
            this.resetMeshes();
            break;
        case 32://space
            this.animation = this.rotating = !this.rotating;
            if (this.rotating) this.animate();
            break;
    }
    this.render();
    return false;
};

G.Viewer.prototype.mouseDownHandler = function (e) {
    if (this.meshes.length === 0) return;
    e.stopPropagation();
    if (e.button === 0) this.rotate = true;
    this.orgX = e.clientX;
    this.orgY = e.clientY;
    return false;
};

G.Viewer.prototype.mouseMoveHandler = function (e) {
    e.stopPropagation();
    if (!this.rotate) return;
    if (this.rotate) {
        this.rotateMeshes((e.clientY - this.orgY) / this.width * 4, (e.clientX - this.orgX) / this.width * 4);
        this.rotating = this.animation = false;
    }
    this.orgX = e.clientX;
    this.orgY = e.clientY;
    this.render();
    return false;
};

G.Viewer.prototype.mouseUpHandler = function (e) {
    e.stopPropagation();
    this.rotate = false;
    return false;
};

G.Viewer.prototype.mouseoutHandler = function (e) {
    e.stopPropagation();
    this.rotate = false;
    return false;
};

G.Viewer.prototype.mouseWheelHandler = function (e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.wheelDelta) {
        this.zoomCamera(e.wheelDelta > 0 ? 1.11 : .9);
    } else {
        this.zoomCamera(e.detail < 0 ? 1.11 : .9);
    }
    this.render();
    return false;
};

G.Viewer.prototype.initModel = function (msg) {
    this.removeAllModels();
    this.removeAllMeshes();

    var v_len = msg.v_len;
    var f_len = msg.f_len;
    var buf = msg.buf;

    this.setStatus({status: "parsing", progress: 0});
    var model = new G.Model();

    var i, j;

    var view = new Float32Array(buf);
    for (i = 0; i < v_len; i++) {
        j = 3 * i;
        model.vs.push(new THREE.Vector3(view[j], view[j + 1], view[j + 2]));
    }

    view = new Uint32Array(buf);
    for (i = 0; i < f_len; i++) {
        j = 3 * i + 3 * v_len;
        model.fs.push(new THREE.Face3(view[j], view[j + 1], view[j + 2]));
    }

    this.setStatus({status: "parsing", progress: 20});
    this.model = model;

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    }
};

function computeCom(vertices) {
    var com = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < vertices.length; i++) com.add(vertices[i]);
    com.multiplyScalar(1 / vertices.length);
    return com;
};

function computeR(vertices, com) {
    var r = 0;
    for (var i = 0; i < vertices.length; i++) {
        var it = new THREE.Vector3();
        it.copy(vertices[i]);
        var d = it.sub(com).lengthSq();
        if (d > r) r = d;
    }
    return Math.sqrt(r);
};

function centerAndScale(vertices) {
    var com = computeCom(vertices);
    var scale = 1 / computeR(vertices, com);
    for (var i = 0; i < vertices.length; i++) {
        vertices[i].sub(com).multiplyScalar(scale);
    }
};

G.Viewer.prototype.updateGeometry = function (buf) {
    var view = new Float32Array(buf);
    var vertices = this.meshes[0].geometry.vertices;

    for (var i = 0; i < vertices.length; i++) {
        vertices[i].x = view[i];
        vertices[i].y = view[i + vertices.length];
        vertices[i].z = view[i + 2 * vertices.length];
    }

    centerAndScale(vertices);

    this.meshes[0].geometry.computeFaceNormals();
    this.meshes[0].geometry.computeVertexNormals();

    this.meshes[0].geometry.verticesNeedUpdate = true;
    this.meshes[0].geometry.normalsNeedUpdate = true;
    this.meshes[0].geometry.dynamic = true;
    this.render();
};

G.Model = function () {
    this.vs = [];
    this.fs = [];
};

G.Model.prototype.dumpObj = function () {
    var ss = [];
    for (var i = 0; i < this.vs.length; i++) {
        ss.push(this.vs[i].toObjString());
    }
    for (var i = 0; i < this.fs.length; i++) {
        ss.push(this.fs[i].toObjString());
    }
    return ss.join("\n");
};

G.Model.prototype.toTHREEGeometry = function () {
    var g3 = new THREE.Geometry();
    for (var i = 0; i < this.vs.length; i++) {
        g3.vertices.push(this.vs[i].clone());
    }
    centerAndScale(g3.vertices);//!Caution
    g3.faces = this.fs;
    return g3;
};

G.Model.prototype.dispose = function () {
    this.vs = null;
    this.fs = null;
};
