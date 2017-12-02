/**
 * Created by mangyo on 12/13/16.
 */

function findType(h, valence) {
    var type = 0;
    if (valence === 3) {
        if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 1;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 2;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 3;
        else if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 4;
    }

    else if (valence === 4) {
        if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 5;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 6;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 7;
        else if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 8;
    }

    else if (valence === 5) {
        if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 9;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 10;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 11;
        else if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 12;
    }

    else if (valence === 6) {
        if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 13;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 14;
        else if ((h.vert.vertexSign === PLUS) && (h.oppo.vert.vertexSign === PLUS))
            type = 15;
        else if ((h.vert.vertexSign === MINUS) && (h.oppo.vert.vertexSign === MINUS))
            type = 16;
    }
    return type;
}

function HfVertex(x, y, z) {
    this.id = 0;
    this.coord = new THREE.Vector3(x, y, z);
    this.edge = undefined;
    this.Seed_Edge = undefined;
}

function HfEdge() {
    this.id = undefined;
    //turn into index
    this.vert = undefined;
    this.oppo = undefined;
    this.next = undefined;
    this.prev = undefined;
    this.face = undefined;
    this.isBorder = false;
    this.isBorderEdge = function () {
        return this.isBorder || this.oppo.isBorder;
    }
}

function HfFace(v_array) {
    this.v_array = v_array; //currently, use vid, counter-clockwise
    this.edge = undefined;
}

function HfMesh() {
    this.verts = [];
    this.faces = [];
    this.edges = [];
}

HfMesh.prototype.build = function () {
    var vidPair2edge = []; // map from vertex pair to edges formed by these vertices
    var edge2svert = [];   // map from edge id to if of start vertex of this edge
    var i, j;
    for (i = 0; i < this.faces.length; ++i) {
        if (typeof this.faces[i] === "undefined") continue; //skip deleted items
        var curFaceEdges = []; // newly added edges
        for (j = 0; j < this.faces[i].v_array.length; ++j) { // every vertex
            var hfEdge = new HfEdge();
            this.add(this.edges, hfEdge);
            curFaceEdges.push(hfEdge);
        }

        for (j = 0; j < this.faces[i].v_array.length; ++j) {
            var vid = this.faces[i].v_array[j];
            var curVert = this.verts[vid];
            var currentEdge = curFaceEdges[j];

            // vertex.edge
            if (typeof curVert.edge === "undefined")
                curVert.edge = currentEdge;

            // set edge topology
            var nextEdge = curFaceEdges[(j + 1) % curFaceEdges.length];

            currentEdge.vert = curVert;
            currentEdge.face = this.faces[i];
            currentEdge.next = nextEdge;
            currentEdge.prev =
                curFaceEdges[((j + curFaceEdges.length) - 1) % curFaceEdges.length];

            // map from next edge to its begin vertex id (this edge === correspond vert)
            edge2svert[nextEdge.id] = curVert;

            if (typeof vidPair2edge[vid] === "undefined")
                vidPair2edge[vid] = [];

            // next vertex id
            var n_vid = this.faces[i].v_array[(j + 1) % curFaceEdges.length]; //v_array.length === eid_list.length
            // check clockwise topology, which causes normal vector fliping
            if (typeof vidPair2edge[vid][n_vid] !== "undefined")               //!TODO how to terminate program
                outputInfo("non-manifold at edge", vid + ", " + n_vid);   //!TODO rm
            else vidPair2edge[vid][n_vid] = nextEdge;
        }
        // set face
        this.faces[i].edge = curFaceEdges[0];
    }

    // add boundary edges and set opposite
    var theEdge, opposite;
    var edgeNum = this.edges.length;
    for (i = 0; i < edgeNum; ++i) {
        theEdge = this.edges[i];
        // find opposite edge, vp2edge[x] is meaningful at least
        opposite = vidPair2edge[this.edges[i].vert.id][edge2svert[i].id];
        if (typeof opposite === "undefined") //no existing edges, boundary
        {
            opposite = new HfEdge();
            this.add(this.edges, opposite);
            opposite.vert = edge2svert[i];

            opposite.isBorder = true;
        }
        if (typeof theEdge.oppo === "undefined") {// not added before
            theEdge.oppo = opposite;
            opposite.oppo = theEdge;
        }
    }

    // link boundary edges
    for (i = 0; i < this.edges.length; ++i) {
        theEdge = this.edges[i];
        if (typeof theEdge.face !== "undefined") {
            // check if clockwise topology exist
            if (typeof theEdge.next === "undefined" ||
                typeof theEdge.prev === "undefined")
                outputInfo("error edge topology edge", i); //!TODO remove
            continue;
        }
        var cursor = theEdge.oppo;
        while (1) {
            cursor = cursor.prev.oppo; // ccw of out edges
            if (typeof cursor.face === "undefined") { // making this clockwise
                theEdge.next = cursor;
                cursor.prev = theEdge;
                break;
            }
        }
    }
};

HfMesh.prototype.GlobalEdgeCounter = 0;
HfMesh.prototype.add = function (container, element) {
    //!TODO add global id support
    if (container === this.edges) {
        element.id = this.GlobalEdgeCounter;
        this.GlobalEdgeCounter++;
    }
    else
        element.id = container.length;
    container.push(element);
};

HfMesh.prototype.delete = function (container, element) {
    container.splice(container.indexOf(element), 1);
};

HfMesh.prototype.addFacet = function (facet) {
    this.faces.push(facet);
};

/////////////////////////MESH OPERATIONS////////////////////////////
//! @brief gives the position of the barycenter of the patch for decimation conquest.
//! @param HalfEdgeHandle h, int valence
//! @return Point3d
function barycenterPatchAfterRemoval(h, valence) {
    var g = h;
    var center = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < valence; i++) {
        center.add(g.vert.coord);
        g = g.next;
    }
    center.divideScalar(valence);
    return center;
}

// creates a new facet within the hole incident to h and g by
// connecting the tip of g with the tip of h with two new
// halfedges and a new vertex and filling this separated part of
// the hole with a new facet. Returns the new halfedge incident to
// the new facet and the new vertex. Precondition: `h->is_border(
// )', `g->is_border()', `h != g', and g can be reached along the
// same hole starting with h.
function addVertexAndFacetToBorder(mesh, h, g) {
    if (g === h || !g.isBorder || !h.isBorder)
        throw new Error();

    var h1 = new HfEdge();
    var h2 = new HfEdge();
    var h1op = new HfEdge();
    var h2op = new HfEdge();

    mesh.add(mesh.edges, h1);
    mesh.add(mesh.edges, h2);
    mesh.add(mesh.edges, h1op);
    mesh.add(mesh.edges, h2op);

    var facet = new HfFace();
    mesh.add(mesh.faces, facet);
    var cur = g;
    var cnt = 0;
    while (cur !== h) {
        cur.isBorder = false;
        cur.face = facet;
        cur = cur.prev;
        if (cnt++ > 1000)
            throw new Error();
    }

    h1.oppo = h1op;
    h2.oppo = h2op;
    h1op.oppo = h1;
    h2op.oppo = h2;

    h1.next = h2;
    h2.prev = h1;
    h1op.prev = h2op;
    h2op.next = h1op;

    h2.next = h.next;//actually it is g
    h.next.prev = h2;
    h.next = h2op;
    h2op.prev = h;

    h1op.next = g.next;
    g.next.prev = h1op;
    g.next = h1;
    h1.prev = g;

    var vertex = new HfVertex(0, 0, 9527);
    mesh.add(mesh.verts, vertex);
    vertex.edge = h1;

    h1.vert = vertex;
    h2op.vert = vertex;
    h1op.vert = g.vert;
    h2.vert = h.vert;

    h1.face = facet;
    h2.face = facet;
    h1op.isBorder = true;
    h2op.isBorder = true;

    facet.edge = h1;

    return h1;
}

// creates a new facet within the hole incident to h and g by connecting
// the vertex denoted by g with the vertex denoted by h with a new halfedge
// and filling this separated part of the hole with a new facet, such that
// the new facet is incident to g.
// Returns the halfedge of the new edge that is incident to the new facet.
function addFacetToBorder(mesh, h, g) {
    if (g === h || g === h.next || !g.isBorder || !h.isBorder)
        throw new Error();

    var h1 = new HfEdge();
    var h1op = new HfEdge();

    mesh.add(mesh.edges, h1);
    mesh.add(mesh.edges, h1op);

    var facet = new HfFace();
    mesh.add(mesh.faces, facet);
    var cur = g;
    var cnt = 0;
    while (cur !== h) {
        cur.isBorder = false;
        cur.face = facet;
        cur = cur.prev;
        if (cnt++ > 1000)
            throw new Error();
    }

    h1.oppo = h1op;
    h1op.oppo = h1;

    h1.next = h.next;
    h.next.prev = h1;
    h1op.prev = h;
    h.next = h1op;

    h1op.next = g.next;
    g.next.prev = h1op;
    g.next = h1;
    h1.prev = g;

    h1.vert = h.vert;
    h1op.vert = g.vert;


    h1.face = facet;
    h1op.isBorder = true;

    facet.edge = h1;

    return h1;
}


//! @brief add center vertex to an existing mesh
//! @only **topology** will be modified, bufferGeometry and other information remain unchanged
//! @param mesh mesh will be add vertex into.
//! @param h is the edge, the vertex is add in its face
function addCenterVertex(mesh, h) {
    if (typeof h === "undefined") return;
    //add center vertex
    var res_v = new HfVertex();
    mesh.add(mesh.verts, res_v);

    var hit = h;
    var prev_eop = undefined;
    do {
        var n_hit = hit.next; //temporarily store.
        //add a new face based on this edge and new vertex
        var edge1 = new HfEdge();
        var edge2 = new HfEdge();

        mesh.add(mesh.edges, edge1);
        mesh.add(mesh.edges, edge2);
        //edge1 next previous properties
        edge1.prev = hit;  //insert tip
        edge1.next = edge2;//close tip
        edge2.prev = edge1;//close tip
        edge2.next = hit;
        hit.prev = edge2;
        hit.next = edge1;
        //edge vertices
        edge1.vert = res_v;
        edge2.vert = hit.oppo.vert;
        //vertex edge
        if (typeof res_v.edge === "undefined")
            res_v.edge = edge1;
        //edge face
        //var v_array = [edge1.vert.id, edge2.vert.id, hit.vert.id];
        //var new_f = new HfFace(v_array);
        var new_f;
        if (hit === h)
            new_f = h.face;
        else {
            new_f = new HfFace();
            mesh.addFacet(new_f);
        }
        // facet -> edge
        new_f.edge = hit;
        // edge -> facet
        edge1.face = new_f;
        edge2.face = new_f;
        hit.face = new_f;

        //edge opposite
        edge2.oppo = prev_eop;
        if (typeof prev_eop !== "undefined")
            prev_eop.oppo = edge2;
        prev_eop = edge1;
        //next triangle
        hit = n_hit;
    } while (hit !== h);

    hit.prev.oppo = prev_eop; //joint the circle
    prev_eop.oppo = hit.prev;

    //mark original face as deleted;
    return res_v;
}

function getNormal(h) {
    var p = h.vert.coord;
    var q = h.next.vert.coord;
    var r = h.next.next.vert.coord;//!TODO may change to h.prev

    var pq = new THREE.Vector3();
    var qr = new THREE.Vector3();

    pq.subVectors(q, p);
    qr.subVectors(r, q);

    var normal = new THREE.Vector3();
    normal.crossVectors(pq, qr);
    return normal;
}

//! @brief Gives a normal vector of the triangle containing h
//! @param halfedge_handle h
//! @return Vector
function triangleNormal(h) {
    return getNormal(h).normalize();
}

//! @brief calculates a normal vector of a patch caused by a removal of a front vertex
//! @param halfedge_handle h, int valence
//! @return Vector
function normalPatch(h, type, valence) {
    var area = [0, 0, 0, 0, 0];

    var normal = new THREE.Vector3(0, 0, 0);
    var normals = [];//5 vectors

    function setNormal(h, index) {
        var n = getNormal(h);
        area[index] = n.length() * 0.5;
        normals[index] = n.normalize();
    }

    // Triangle
    if ((type === 1) || (type === 2) || (type === 3) || (type === 4)) {
        setNormal(h, 1);
    }

    // quadrangle
    else if ((type === 5) || (type === 8)) {
        setNormal(h, 1);
        h = h.prev.oppo;
        setNormal(h, 2);
    }

    else if (( type === 6) || (type === 7)) {
        setNormal(h, 1);
        h = h.next.oppo;
        setNormal(h, 2);
    }

    // pentagone
    else if ((type === 9) || (type === 12)) {
        setNormal(h, 1);
        h = h.prev.oppo;
        setNormal(h, 2);
        h = h.next.oppo;
        setNormal(h, 3);
    }

    else if (type === 10) {
        setNormal(h, 1);
        h = h.next.oppo;
        setNormal(h, 2);
        h = h.prev.oppo;
        setNormal(h, 3);
    }

    else if (type === 11) {
        var g = h;
        setNormal(h, 1);
        h = g.prev.oppo;
        setNormal(h, 2);
        h = g.next.oppo;
        setNormal(h, 3);
    }

    // Hexagone
    else if ((type === 13) || (type === 16)) {
        setNormal(h, 1);
        h = h.prev.oppo;
        var g = h;
        setNormal(h, 2);
        h = g.prev.oppo;
        setNormal(h, 3);
        h = g.next.oppo;
        setNormal(h, 4);
    }

    else if ((type === 14) || (type === 15)) {
        setNormal(h, 1);
        h = h.next.oppo;
        var g = h;
        setNormal(h, 2);
        h = g.prev.oppo;
        setNormal(h, 3);
        h = g.next.oppo;
        setNormal(h, 4);
    }

    var i;

    for (i = 0; i < (valence - 2); i++)
        area[0] = area[0] + area[i + 1];

    if (area[0] === 0.0)
        return;

    for (i = 0; i < (valence - 2); i++)
        area[i + 1] = area[i + 1] / area[0];

    for (i = 0; i < (valence - 2); i++) {
        if (typeof normals[i + 1] === "undefined") {
            console.warn("valence error");
        }
        normal.add(normals[i + 1].multiplyScalar(area[i + 1]));
    }

    return normal.normalize();
}

HfMesh.prototype.joinFacet = function (h) {
    //!TODO:  add precondition vertex circulator size >= 3
    //delete h.oppo.face
    var g = h.oppo.next;//g may be undefined..
    while (g !== h.oppo) {
        g.face = h.face;
        g = g.next;
    }
    this.delete(this.faces, g.face);

    //important!!!
    g.next.prev = h.prev;
    h.prev.next = g.next;

    g.prev.next = h.next;
    h.next.prev = g.prev;

    h.vert.edge = g.prev;
    g.vert.edge = h.prev;
    h.face.edge = h.prev;
    var hPrev = h.prev;

    //delete h&h.oppo
    this.delete(this.edges, h.oppo);
    this.delete(this.edges, h);

    return hPrev;
};

//！@brief Remove edges to create a hole
//! @param mesh, halfedgeHandle h, int type
//! @return true if succeeds
function removeEdges(mesh, h, type) {
    var check = false;
    var g = h;

    //triangle
    if ((type === 1) || (type === 2) || (type === 4)) {
        if (g.next.vert.vertexSign === NOSIGN)
            g.next.vert.vertexSign = PLUS;
    }
    else if (type === 3) {
        if (g.next.vert.vertexSign === NOSIGN)
            g.next.vert.vertexSign = MINUS;
    }
    // quadrangle
    else if ((type === 5) || (type === 8)) {
        //verification
        if (g.prev.oppo.face.facetFlag !== FREE)
            check = true;
        else {
            g = g.prev;
            mesh.joinFacet(g);
            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = PLUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = MINUS;
        }
    }
    else if ((type === 6) || (type === 7)) {
        //verification
        if (g.next.oppo.face.facetFlag !== FREE)
            check = true;
        if (check === false) {
            g = g.next;
            mesh.joinFacet(g);

            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = MINUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = PLUS;
        }
    }
    //pentagone
    else if ((type === 9) || (type === 12)) {
        g = g.prev.oppo;
        if (g.face.facetFlag !== FREE)
            check = true;
        g = g.next.oppo;
        if (g.face.facetFlag !== FREE)
            check = true;

        if (check === false) {
            g = h.prev;
            g = mesh.joinFacet(g);
            g = g.next;
            g = mesh.joinFacet(g);

            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = PLUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = MINUS;
            if (g.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.vert.vertexSign = PLUS;
        }
    }

    else if (type === 10) {
        g = g.next.oppo;
        if (g.face.facetFlag !== FREE)
            check = true;

        g = g.prev.oppo;
        if (g.face.facetFlag !== FREE)
            check = true;

        if (check === false) {
            g = h.next.oppo;
            g = mesh.joinFacet(g);
            g = mesh.joinFacet(g);

            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = PLUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = MINUS;
            if (g.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.vert.vertexSign = PLUS;
        }

    }

    else if (type === 11) {
        if (g.next.oppo.face.facetFlag !== FREE)
            check = true;
        if (g.prev.oppo.face.facetFlag !== FREE)
            check = true;

        if (check === false) {
            g = g.next;
            g = mesh.joinFacet(g);
            g = g.prev;
            g = mesh.joinFacet(g);

            g = h;

            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = MINUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = PLUS;
            if (g.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.vert.vertexSign = MINUS;
        }
    }

    else if ((type === 13) || (type === 16)) {
        g = g.prev.oppo;
        if (g.face.facetFlag !== FREE)
            check = true;
        if (g.next.oppo.face.facetFlag !== FREE)
            check = true;
        if (g.prev.oppo.face.facetFlag !== FREE)
            check = true;

        if (check === false) {
            g = h.prev.oppo;
            g = mesh.joinFacet(g);
            g = mesh.joinFacet(g);
            g = mesh.joinFacet(g);

            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = PLUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = MINUS;
            if (g.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.vert.vertexSign = PLUS;
            if (g.next.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.next.vert.vertexSign = MINUS;
        }
    }

    else if ((type === 14) || (type === 15)) {
        g = g.next.oppo;

        if (typeof g.next.oppo.face === "undefined") {
            console.log("xxxxxxg");
        }

        if (g.face.facetFlag !== FREE)
            check = true;
        if (g.next.oppo.face.facetFlag !== FREE)
            check = true;
        if (g.prev.oppo.face.facetFlag !== FREE)
            check = true;

        if (check === false) {
            g = h.next.oppo;
            g = mesh.joinFacet(g);
            g = mesh.joinFacet(g);
            g = mesh.joinFacet(g);

            g = h;
            if (g.next.vert.vertexSign === NOSIGN)
                g.next.vert.vertexSign = MINUS;
            if (g.next.next.vert.vertexSign === NOSIGN)
                g.next.next.vert.vertexSign = PLUS;
            if (g.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.vert.vertexSign = MINUS;
            if (g.next.next.next.next.vert.vertexSign === NOSIGN)
                g.next.next.next.next.vert.vertexSign = PLUS;
        }
    }
    return check;
}

//! @brief Calculates base vectors of new frenet coordinates system
//! @param t is obj{T1:X,T2:X} ,vector normal
//! @return Vector
function calculateT1T2(t, normal) {
    var u = new THREE.Vector3();
    u.subVectors(t.T1.vert.coord, t.T1.oppo.vert.coord);
    u.normalize();

    // actually normal and u have been normalized
    var product = u.length() * normal.length();

    var dot = u.dot(normal);
    var cosine = 0;
    if (product !== 0) {
        cosine = dot / product;
    }

    cosine = THREE.Math.clamp(cosine, -1, 1);

    var cosine_rad = Math.acos(cosine);
    var beta_rad = 0;
    if (cosine_rad <= Math.PI / 2)
        beta_rad = Math.PI / 2 - cosine_rad;
    else
        beta_rad = cosine_rad - Math.PI / 2;
    var beta = Math.cos(beta_rad);

    if (beta !== 0) {
        // T1 = (u - cosine * normal) / beta;//TODO figure out this formula
        t.T1 = normal.clone().multiplyScalar(-cosine).add(u).divideScalar(beta);
        t.T2 = new THREE.Vector3();
        t.T2.crossVectors(normal, t.T1);
    }
}

//! @brief Calculates base vectors of new frenet coordinates system
//! @param halfedge_handle h, vector normal, vertor T2
//! @return Vector
function inverseFrenetRotation(frenet, T1, T2, normal) {
    console.error("ill implemented, inverseFrenetRotation is in unused_lib.js!");
    throw new Error();
}

