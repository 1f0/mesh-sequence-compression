function Unsimplify() {
    this.Seed_Edge = undefined;
} // namespace

//! @brief Initiate element flags for Decompression
Unsimplify.prototype.initMesh = function (mesh) {
    // vertices flags initialization
    for (var pv = 0; pv < mesh.verts.length; ++pv) {
        mesh.verts[pv].vertexFlag = FREE;
        mesh.verts[pv].vertexSign = NOSIGN;
    }
    // facets flag initialization.
    for (var j = 0; j < mesh.faces.length; ++j) {
        //if (typeof mesh.faces[j] === "undefined") continue;//!TODO rm wierd code
        mesh.faces[j].facetFlag = FREE;
    }
};

Unsimplify.prototype.setModel = function (obj, smallest, decompr, componentId) {
    var decoder = decompr.decoder;
    var Qbit = decompr.Qbit_list[componentId] + decompr.NumberChangeQuantization[componentId];

    var range = decoder.getBits(Qbit + 1);
    obj.offset = decoder.getBits(Qbit + 1);

    if (smallest < 0)
        obj.offset += smallest;

    obj.check = false;
    if (range === 0 || range === 1) {
        obj.check = true;
        range = 2;
    }
    obj.model = new AdaptiveDataModel(range);
};

Unsimplify.prototype.getDiff = function (pass, decompr, alpha, gamma, valence, gateType) {
    var decoder = decompr.decoder;

    var normal;
    if (typeof valence === "undefined")
        normal = triangleNormal(pass);
    else
        normal = normalPatch(pass, gateType, valence);

    var t = {T1: pass};
    if (typeof normal !== "undefined")
        calculateT1T2(t, normal);

    if (typeof t.T1 === "undefined" ||
        typeof t.T2 === "undefined" ||
        typeof normal === "undefined") {
        t.T1 = new THREE.Vector3(1, 0, 0);
        t.T2 = new THREE.Vector3(0, 1, 0);
        normal = new THREE.Vector3(0, 0, 1);
    }

    var frenet = new THREE.Vector3();
    if (!alpha.check) {
        frenet.x = decoder.decode(alpha.model);
        frenet.y = decoder.decode(alpha.model);
    } else {
        frenet.x = 0;
        frenet.y = 0;
    }
    if (!gamma.check)
        frenet.z = decoder.decode(gamma.model);
    else
        frenet.z = 0;

    frenet.x -= alpha.offset;
    frenet.y -= alpha.offset;
    frenet.z -= gamma.offset;

    var diff;
    if (decompr.Is_Bijection_Enabled) {
        console.warn("biject! inverseFrenetRotation not verified");
        diff = inverseFrenetRotation(frenet, t.T1, t.T2, normal);
    }
    else {
        diff = frenet;
    }
    return diff;
};

//!@param pass: halfedge handle
//!@return vector center
Unsimplify.prototype.calculateCenter = function (pass, decompr, componentId, alpha, gamma, valence, gateType) {
    var diff = this.getDiff(pass, decompr, alpha, gamma, valence, gateType);
    if (typeof valence === "undefined")
        valence = 3;
    else
        removeEdges(decompr.mesh, pass, gateType);

    var baryCenter = barycenterPatchAfterRemoval(pass, valence);
    var BC = decompr.Change_Real_Int(baryCenter, componentId);
    var center = new THREE.Vector3();
    center.addVectors(BC, diff);
    decompr.Change_Int_Real(center, componentId);

    return center;
};

Unsimplify.prototype.findSeedGate = function (edges, componentId) {
    // find seed edge
    // for armadillo, it should be 323, 803
    for (var sgId = 0; edges[sgId].vert.Seed_Edge !== 2 * componentId ||
    edges[sgId].oppo.vert.Seed_Edge !== 2 * componentId + 1; sgId++);

    this.Seed_Edge = edges[sgId];

    this.Seed_Edge.vert.vertexFlag = CONQUERED;
    this.Seed_Edge.oppo.vertexFlag = CONQUERED;
};


Unsimplify.prototype.unRegulation = function (decompr, componentId) {
    var mesh = decompr.mesh;

    this.initMesh(mesh);

    var connectivity = new AdaptiveDataModel(2);

    var alpha = {};
    var gamma = {};

    this.setModel(alpha, decompr.Smallest_Alpha, decompr, componentId);
    this.setModel(gamma, decompr.Smallest_Gamma, decompr, componentId);

    /*//!TODO add color support
     float Color_step = 0.0;
     if (this.NumberColorQuantization[Component_ID] === 0)
     Color_step = ...
     //*/

    this.findSeedGate(mesh.edges, componentId);
    var halfEdgeQueue = [this.Seed_Edge];

    while (halfEdgeQueue.length > 0) {
        var h = halfEdgeQueue[0];
        halfEdgeQueue.splice(0, 1);// Queue.pop

        var facetFlag = h.face.facetFlag;
        if (facetFlag === CONQUERED || facetFlag === TO_BE_REMOVED)// already visited
            continue;

        var valence = decompr.decoder.decode(connectivity) + 3;
        if (valence === 3) {
            var g = h;
            var center = this.calculateCenter(h, decompr, componentId, alpha, gamma);

            //TODO: consider assign the region number, which is now always -1, to inserted vertex

            // Insertion of a vertex
            var resVert = addCenterVertex(mesh, g);
            resVert.vertexFlag = CONQUERED;
            resVert.coord.copy(center);
            resVert.Seed_Edge = -1;

            //TODO removal_order, region number is not added now
            g.face.facetFlag = CONQUERED;
            g = g.next;

            function someTag(g) {
                g = g.oppo.prev;
                g.oppo.vert.vertexFlag = CONQUERED;// vertex flag is not useful
                g.face.facetFlag = CONQUERED;
                if (!g.prev.isBorderEdge()) {
                    var h1 = g.prev.oppo;
                    h1.face.facetFlag = CONQUERED;
                    h1.next.vert.vertexFlag = CONQUERED;
                    if (!h1.next.isBorderEdge())
                        halfEdgeQueue.push(h1.next.oppo);
                    if (!h1.prev.isBorderEdge())
                        halfEdgeQueue.push(h1.prev.oppo);
                }
                return g;
            }

            g = someTag(g);
            g = someTag(g);
            //!TODO add color support here
        }
        else {
            if (typeof h.prev.vert === "undefined") {
                console.log("xx");
            }
            h.next.face.facetFlag = CONQUERED;
            h.prev.vert.vertexFlag = CONQUERED;
            if (!h.next.isBorderEdge())
                halfEdgeQueue.push(h.next.oppo);
            if (!h.prev.isBorderEdge())
                halfEdgeQueue.push(h.prev.oppo);
        }
    }
};

//! @brief remove facet f, which is incident to h,
//! and make all incident halfedge border or removed(already border)
//! @param HalfEdgeHandle h
Unsimplify.prototype.eraseFacet = function (mesh, h) {
    //precondition:
    if (typeof h.face === "undefined")
        alert("h is already outer border");
    mesh.delete(mesh.faces, h.face);

    var g = h;
    var gnext;
    do {
        gnext = g.next;
        if (g.oppo.isBorder && gnext.oppo.isBorder && gnext.oppo.next === g.oppo) {
            mesh.delete(mesh.verts, g.vert);
        }
        if (g.oppo.isBorder) {
            //adjust incident vertex
            if (g.vert.edge === g)
                g.vert.edge = g.next.oppo;
            if (g.oppo.vert.edge === g.oppo)
                g.oppo.vert.edge = g.oppo.next.oppo;

            //adjust adjacent edge
            if (typeof g.prev !== "undefined") {
                g.prev.next = g.oppo.next;
                g.prev.next.prev = g.prev;
            }
            if (!g.next.oppo.isBorder) {
                g.next.prev = g.oppo.prev;
                g.next.prev.next = g.next;
            }
            if (g !== h) {
                mesh.delete(mesh.edges, g.oppo);
                mesh.delete(mesh.edges, g);
            }
        } else {
            g.isBorder = true;
            g.face = undefined;
        }
        g = gnext;
    } while (g !== h);

    if (h.oppo.isBorder) {
        mesh.delete(mesh.edges, h.oppo);
        mesh.delete(mesh.edges, h);
    }
};

Unsimplify.prototype.unDecimation = function (decompr, componentId) {
    var mesh = decompr.mesh;
    this.initMesh(mesh);//set flag to NOSIGN/FREE

    var numberConnectivitySymbols =
        decompr.IsClosed[componentId] ? 5 : 7;

    var connectivity = new AdaptiveDataModel(numberConnectivitySymbols);

    var alpha = {};
    var gamma = {};

    this.setModel(alpha, decompr.Smallest_Alpha, decompr, componentId);
    this.setModel(gamma, decompr.Smallest_Gamma, decompr, componentId);

    this.findSeedGate(mesh.edges, componentId);
    this.Seed_Edge.vert.vertexSign = PLUS;
    this.Seed_Edge.oppo.vert.vertexSign = MINUS;

    var halfEdgeQueue = [this.Seed_Edge];
    while (halfEdgeQueue.length > 0) {
        var h = halfEdgeQueue[0];
        halfEdgeQueue.splice(0, 1);// Queue.pop

        var facetFlag = h.face.facetFlag;
        if (facetFlag === CONQUERED || facetFlag === TO_BE_REMOVED)// already visited
            continue;

        var valence = decompr.decoder.decode(connectivity) + 3;
        var type, center, numberJump, i;
        var borderEdges;
        var g = h;

        if (valence >= 3 && valence <= 6) {
            type = findType(h, valence);
            center = this.calculateCenter(h, decompr, componentId, alpha, gamma, valence, type);

            var resVert = addCenterVertex(mesh, g);
            resVert.vertexFlag = CONQUERED;
            resVert.coord.copy(center);

            g.face.facetFlag = TO_BE_REMOVED;
            g.vert.vertexFlag = CONQUERED;
            g.oppo.vert.vertexFlag = CONQUERED;

            for (i = 0; i < (valence - 1); i++) {
                g = g.next.oppo.next;
                g.face.facetFlag = TO_BE_REMOVED;
                g.vert.vertexFlag = CONQUERED;
                g.oppo.vert.vertexFlag = CONQUERED;
                if (g.isBorderEdge() === false) {
                    halfEdgeQueue.push(g.oppo);
                }
            }
            g.next.vert.Seed_Edge = -1;

            //!TODO: add color support
        } else if (valence === 8 || valence === 9) { //border edge
            type = findType(h, valence - 5);
            var diff = this.getDiff(h, decompr, alpha, gamma, valence - 5, type);
            //!TODO: add color support here

            // border edge with valence === 3
            if (valence === 8) {
                borderEdges = [];

                var baryCenter = barycenterPatchAfterRemoval(h, 3);//valence - 5);
                var BC = decompr.Change_Real_Int(baryCenter, componentId);
                center = new THREE.Vector3();
                center.addVectors(BC, diff);
                decompr.Change_Int_Real(center, componentId);

                //!TODO average color here

                numberJump = 0;
                if (g.next.isBorderEdge())
                    numberJump = 0;
                if (g.prev.isBorderEdge()) {
                    numberJump = 1;
                    g = g.next;
                }
                borderEdges.push(g.oppo);
                g = g.prev;
                borderEdges.push(g.oppo);
                this.eraseFacet(mesh, g);

                var prevEdge = borderEdges[1].oppo.prev;

                g = addVertexAndFacetToBorder(mesh, prevEdge, borderEdges[1].oppo);
                g.vert.coord.copy(center);
                g.vert.vertexFlag = CONQUERED;

                //!TODO color support here

                prevEdge = prevEdge.next;
                addFacetToBorder(mesh, prevEdge, borderEdges[0].oppo);

                var tagHandle;
                if (numberJump === 0)
                    tagHandle = borderEdges[1];
                else if (numberJump === 1)
                    tagHandle = borderEdges[0].oppo;
                tagHandle.vert.vertexFlag = CONQUERED;

                //triangle
                if ((type === 1) || (type === 2) || (type === 4)) {
                    if (tagHandle.vert.vertexSign === NOSIGN)
                        tagHandle.vert.vertexSign = PLUS;
                }
                else if (type === 3) {
                    if (tagHandle.vert.vertexSign === NOSIGN)
                        tagHandle.vert.vertexSign = MINUS;
                }
                for (i = 0; i < 2; i++) {
                    borderEdges[i].oppo.face.facetFlag = CONQUERED;
                    if (i !== numberJump)
                        halfEdgeQueue.push(borderEdges[i]);
                }
            } else if (valence === 9) {
                borderEdges = [];
                numberJump = -1;

                if ((type === 5) || (type === 8)) {
                    // jump === 0;
                    if (g.next.isBorderEdge()) {
                        numberJump = 0;

                        borderEdges.push(g.oppo);

                        borderEdges.push(g.prev.oppo.prev.oppo);
                        borderEdges.push(g.prev.oppo.next.oppo);

                        this.eraseFacet(mesh, borderEdges[0].oppo);
                        this.eraseFacet(mesh, borderEdges[1].oppo);
                    }

                    // jump === 1;
                    else if (g.prev.oppo.next.isBorderEdge()) {
                        numberJump = 1;

                        borderEdges.push(g.next.oppo);
                        borderEdges.push(g.oppo);
                        borderEdges.push(g.prev.oppo.prev.oppo);

                        this.eraseFacet(mesh, borderEdges[2].oppo);
                        this.eraseFacet(mesh, borderEdges[0].oppo);
                    }

                    // jump === 2;
                    else {
                        numberJump = 2;

                        borderEdges.push(g.prev.oppo.next.oppo);
                        borderEdges.push(g.next.oppo);
                        borderEdges.push(g.oppo);

                        this.eraseFacet(mesh, borderEdges[0].oppo);
                        this.eraseFacet(mesh, borderEdges[1].oppo);
                    }
                } else {
                    if (g.prev.isBorderEdge()) {
                        numberJump = 2;

                        borderEdges.push(g.next.oppo.prev.oppo);
                        borderEdges.push(g.next.oppo.next.oppo);
                        borderEdges.push(g.oppo);

                        this.eraseFacet(mesh, borderEdges[2].oppo);
                        this.eraseFacet(mesh, borderEdges[1].oppo);
                    } else if (g.next.oppo.prev.isBorderEdge()) {
                        numberJump = 1;

                        borderEdges.push(g.next.oppo.next.oppo);
                        borderEdges.push(g.oppo);
                        borderEdges.push(g.prev.oppo);

                        this.eraseFacet(mesh, borderEdges[0].oppo);
                        this.eraseFacet(mesh, borderEdges[1].oppo);
                    } else {
                        numberJump = 0;

                        borderEdges.push(g.oppo);
                        borderEdges.push(g.prev.oppo);
                        borderEdges.push(g.next.oppo.prev.oppo);

                        this.eraseFacet(mesh, borderEdges[2].oppo);
                        this.eraseFacet(mesh, borderEdges[1].oppo);
                    }

                }

                g = h;

                var p0 = borderEdges[0].vert.coord;
                var p1 = borderEdges[0].oppo.vert.coord;
                var p2 = borderEdges[1].vert.coord;
                var p3 = borderEdges[2].vert.coord;

                var baryCenter = new THREE.Vector3(
                    (p0.x + p1.x + p2.x + p3.x) / 4,
                    (p0.y + p1.y + p2.y + p3.y) / 4,
                    (p0.z + p1.z + p2.z + p3.z) / 4);

                var BC = decompr.Change_Real_Int(baryCenter, componentId);
                center = new THREE.Vector3(0, 0, 0);
                center.addVectors(BC, diff);
                decompr.Change_Int_Real(center, componentId);

                // to create the new facets
                var prevEdge = borderEdges[2].oppo.prev;
                g = addVertexAndFacetToBorder(mesh, prevEdge, borderEdges[2].oppo);
                g.vert.coord.copy(center);

                //!TODO color support here

                prevEdge = prevEdge.next;
                addFacetToBorder(mesh, prevEdge, borderEdges[1].oppo);
                addFacetToBorder(mesh, prevEdge, borderEdges[0].oppo);

                //vertex_tag
                if (numberJump === 0) {
                    if ((type === 5) || (type === 8)) {
                        if (borderEdges[2].vert.vertexSign === NOSIGN)
                            borderEdges[2].vert.vertexSign = PLUS;
                        if (borderEdges[2].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[2].oppo.vert.vertexSign = MINUS;
                    } else {
                        if (borderEdges[2].vert.vertexSign === NOSIGN)
                            borderEdges[2].vert.vertexSign = MINUS;
                        if (borderEdges[2].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[2].oppo.vert.vertexSign = PLUS;
                    }

                } else if (numberJump === 1) {
                    if ((type === 5) || (type === 8)) {
                        if (borderEdges[2].vert.vertexSign === NOSIGN)
                            borderEdges[2].vert.vertexSign = MINUS;
                        if (borderEdges[0].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[0].oppo.vert.vertexSign = PLUS;
                    } else {
                        if (borderEdges[2].vert.vertexSign === NOSIGN)
                            borderEdges[2].vert.vertexSign = PLUS;
                        if (borderEdges[0].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[0].oppo.vert.vertexSign = MINUS;
                    }

                } else // jump === 2
                {
                    if ((type === 5) || (type === 8)) {
                        if (borderEdges[0].vert.vertexSign === NOSIGN)
                            borderEdges[0].vert.vertexSign = PLUS;
                        if (borderEdges[0].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[0].oppo.vert.vertexSign = MINUS;
                    } else {
                        if (borderEdges[0].vert.vertexSign === NOSIGN)
                            borderEdges[0].vert.vertexSign = MINUS;
                        if (borderEdges[0].oppo.vert.vertexSign === NOSIGN)
                            borderEdges[0].oppo.vert.vertexSign = PLUS;
                    }

                }

                for (i = 0; i < 3; i++) {
                    borderEdges[i].oppo.face.facetFlag = CONQUERED;

                    borderEdges[i].vert.vertexFlag = CONQUERED;
                    borderEdges[i].oppo.vert.vertexFlag = CONQUERED;

                    if (i !== numberJump)
                        halfEdgeQueue.push(borderEdges[i]);
                }

            }
        } else if (valence === 7) { // the symbol == N
            h.face.facetFlag = CONQUERED;
            h.next.vert.vertexFlag = CONQUERED;
            if (h.vert.vertexSign === PLUS && h.oppo.vert.vertexSign === MINUS) {
                if (h.next.vert.vertexSign === NOSIGN)
                    h.next.vert.vertexSign = PLUS;
            } else if (h.vert.vertexSign === MINUS && h.oppo.vert.vertexSign === PLUS) {
                if (h.next.vert.vertexSign === NOSIGN)
                    h.next.vert.vertexSign = PLUS;
            } else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === PLUS)) {
                if (h.next.vert.vertexSign === NOSIGN)
                    h.next.vert.vertexSign = MINUS;
            } else if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === MINUS)) {
                if (h.next.vert.vertexSign === NOSIGN)
                    h.next.vert.vertexSign = PLUS;
            }
            if (h.next.isBorderEdge() === false) {
                halfEdgeQueue.push(h.next.oppo);
            }
            if (h.prev.isBorderEdge() === false) {
                halfEdgeQueue.push(h.prev.oppo);
            }
        }
    }
};

Unsimplify.prototype.augmentGeometry = function (mesh, componentId) {
    console.log("unimplemented geo");
    throw new Error();
};

Unsimplify.prototype.augmentColor = function (mesh, componentId) {
    console.log("unimplemented color");
    throw new Error();
};


