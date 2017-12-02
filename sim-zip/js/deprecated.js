'use strict';
//! @brief Calculates base vectors of new frenet coordinates system
//! @param halfedge_handle h, vector normal, vertor T2
//! @return Vector
function inverseFrenetRotation(frenet, T1, T2, normal) {
    var M = new THREE.Matrix3(//column major
        T1.x, T2.x, normal.x,
        T1.y, T2.y, normal.y,
        T1.z, T2.z, normal.z
    );

    var D1 = new THREE.Matrix3(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    );
    var D2 = new THREE.Matrix3(
        0, 1, 0,
        1, 0, 0,
        0, 0, 1
    );
    var D3 = new THREE.Matrix3(
        -1, 0, 0,
        0, -1, 0,
        0, 0, 1
    );
    var D4 = new THREE.Matrix3(
        1, 0, 0,
        0, 0, 1,
        0, 1, 0
    );
    var D5 = new THREE.Matrix3(
        1, 0, 0,
        0, -1, 0,
        0, 0, -1
    );

    var S = [];// matrix array[16]
    function get(m, i, j) {
        return m[i + j * 3];
    }

    function matricesProduct(A, B) {
        var a = A.elements;
        var b = B.elements;
        var res = new THREE.Matrix3();
        var out = res.elements;
        var a00 = a[0], a01 = a[1], a02 = a[2],
            a10 = a[3], a11 = a[4], a12 = a[5],
            a20 = a[6], a21 = a[7], a22 = a[8],
            b00 = b[0], b01 = b[1], b02 = b[2],
            b10 = b[3], b11 = b[4], b12 = b[5],
            b20 = b[6], b21 = b[7], b22 = b[8];
        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22;
        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b10 * a02 + b11 * a12 + b12 * a22;
        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return res;
    }

    function square(a) {
        return a * a;
    }

    function sign(a) {
        return a < 0 ? -1 : 1;
    }

    // Verify in order to find the smallest rotation angle.
    if (Math.abs(get(M, 0, 2)) > Math.abs(get(M, 1, 2)))
        S.push(D2);//S[0]
    else
        S.push(D1);//S[0]

    M = matricesProduct(S[0], M);
    if (get(M, 1, 2) < 0)
        S.push(D3);//S[1]
    else
        S.push(D1);

    M = matricesProduct(S[1], M);

    /// first rotation angle : phi;
    var phi = -100;
    if (get(M, 0, 2) === 0 && get(M, 1, 2) === 0)
        phi = 0;
    else
        phi = sign(-get(M, 1, 2)) * Math.acos(get(M, 1, 2)) /
            Math.sqrt(square(get(M, 0, 2)) + square(get(M, 1, 2)));

    S.push(new THREE.Matrix3(
        1, -Math.tan(phi / 2), 0,
        0, 1, 0,
        0, 0, 1
    ));//S[2]

    S.push(new THREE.Matrix3(
        1, 0, 0,
        Math.sin(phi), 1, 0,
        0, 0, 1
    ));//S[3]

    S.push(S[2].clone());//S[4]

    var R1inv = new THREE.Matrix3(
        Math.cos(phi), Math.sin(phi), 0,
        -Math.sin(phi), Math.cos(phi), 0,
        0, 0, 1
    );

    M = matricesProduct(R1inv, M);

    if (Math.abs(get(M, 1, 2)) > Math.abs(get(M, 2, 2)))
        S.push(D4);//S[5]
    else
        S.push(D1);//S[5]

    M = matricesProduct(S[5], M);

    if (get(M, 2, 2) < 0)
        S.push(D5);
    else
        S.push(D1);//S[6]

    M = matricesProduct(S[6], M);

    /// Second rotation angle psi.
    var psi = -100;
    if (get(M, 1, 2) === 0 && get(M, 2, 2) === 0)
        psi = 0;
    else
        psi = sign(-get(M, 1, 2)) * Math.acos(get(M, 2, 2)) /
            Math.sqrt(square(get(M, 1, 2)) + square(get(M, 2, 2)));

    S.push(new THREE.Matrix3(
        1, 0, 0,
        0, 1, -Math.tan(psi / 2),
        0, 0, 1
    ));//S[7]

    S.push(new THREE.Matrix3(
        1, 0, 0,
        0, 1, 0,
        0, Math.sin(psi), 1
    ));//S[8]

    S.push(S[7].clone());//S[9]

    var R2inv = new THREE.Matrix3(
        1, 0, 0,
        0, Math.cos(psi), Math.sin(psi),
        0, -Math.sin(psi), Math.cos(psi)
    );

    M = matricesProduct(R2inv, M);

    if (Math.abs(get(M, 0, 1)) > Math.abs(get(M, 1, 1)))
        S.push(D2);//S[10]
    else
        S.push(D1);//S[10]

    M = matricesProduct(S[10], M);

    if (get(M, 1, 1) < 0)
        S.push(D3);
    else
        S.push(D1);//S[11]

    M = matricesProduct(S[11], M);

    /// Last rotation angle theta.
    var theta = -100;
    if (get(M, 0, 1) === 0 && get(M, 1, 1) === 0)
        theta = 0;
    else
        theta = sign(-get(M, 0, 1)) * Math.acos(get(M, 1, 1)) /
            Math.sqrt(square(get(M, 0, 1)) + square(get(M, 1, 1)));

    S.push(new THREE.Matrix3(
        1, -Math.tan(theta / 2), 0,
        0, 1, 0,
        0, 0, 1
    ));//S[12]

    S.push(new THREE.Matrix3(
        1, 0, 0,
        Math.sin(theta), 1, 0,
        0, 0, 1
    ));//S[13]

    S.push(S[12].clone());//S[14]

    var u = frenet.clone();
    for (var i = 14; i > -1; i--) {
        u.applyMatrix3(S[i]).multiplyScalar(-1);
        u.x = -Math.ceil(u.x - 0.5);
        u.y = -Math.ceil(u.y - 0.5);
        u.z = -Math.ceil(u.z - 0.5);
    }

    return u;
}

////////////////////three js///////////compute normal///////////
function faceNormal() {
    for (var a = new THREE.Vector3, b = new THREE.Vector3, c = 0, d = this.faces.length; c < d; c++) {
        var e = this.faces[c], f = this.vertices[e.a], h = this.vertices[e.b];
        a.subVectors(this.vertices[e.c], h);
        b.subVectors(f, h);
        a.cross(b);
        a.normalize();
        e.normal.copy(a)
    }
}
function vertexNormal(a) {//a is areaWeighted boolean
    var b, c, d, e;
    if (void 0 === this.__tmpVertices) {
        e = this.__tmpVertices = Array(this.vertices.length);
        b = 0;
        for (c = this.vertices.length; b < c; b++)
            e[b] = new THREE.Vector3;
        b = 0;
        for (c = this.faces.length; b < c; b++)
            d = this.faces[b],
            d instanceof THREE.Face3 ? d.vertexNormals = [new THREE.Vector3, new THREE.Vector3, new THREE.Vector3] : d instanceof THREE.Face4 && (d.vertexNormals = [new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3])
    } else {
        e = this.__tmpVertices;
        b = 0;
        for (c = this.vertices.length; b < c; b++)
            e[b].set(0, 0, 0)
    }
    if (a) {
        var f, h, g, i = new THREE.Vector3, j = new THREE.Vector3, l = new THREE.Vector3, m = new THREE.Vector3, n = new THREE.Vector3;
        b = 0;
        for (c = this.faces.length; b < c; b++)
            d = this.faces[b], d instanceof THREE.Face3 ? (a = this.vertices[d.a],
                f = this.vertices[d.b], h = this.vertices[d.c], i.subVectors(h, f), j.subVectors(a, f), i.cross(j), e[d.a].add(i), e[d.b].add(i), e[d.c].add(i)) : d instanceof THREE.Face4 && (a = this.vertices[d.a], f = this.vertices[d.b], h = this.vertices[d.c], g = this.vertices[d.d], l.subVectors(g, f), j.subVectors(a, f), l.cross(j), e[d.a].add(l), e[d.b].add(l), e[d.d].add(l), m.subVectors(g, h), n.subVectors(f, h), m.cross(n), e[d.b].add(m), e[d.c].add(m), e[d.d].add(m))
    } else {
        b = 0;
        for (c = this.faces.length; b < c; b++)
            d = this.faces[b], d instanceof THREE.Face3 ?
            (e[d.a].add(d.normal), e[d.b].add(d.normal), e[d.c].add(d.normal)) : d instanceof THREE.Face4 && (e[d.a].add(d.normal), e[d.b].add(d.normal), e[d.c].add(d.normal), e[d.d].add(d.normal))
    }
    b = 0;
    for (c = this.vertices.length; b < c; b++)
        e[b].normalize();
    b = 0;
    for (c = this.faces.length; b < c; b++)
        d = this.faces[b], d instanceof THREE.Face3 ? (d.vertexNormals[0].copy(e[d.a]), d.vertexNormals[1].copy(e[d.b]), d.vertexNormals[2].copy(e[d.c])) : d instanceof THREE.Face4 && (d.vertexNormals[0].copy(e[d.a]), d.vertexNormals[1].copy(e[d.b]), d.vertexNormals[2].copy(e[d.c]),
            d.vertexNormals[3].copy(e[d.d]))
}


function meshToArrayBuffer(mesh) {
    var vlen = mesh.verts.length * 4 * 3;
    var flen = mesh.faces.length * 4 * 3;

    var buf = new ArrayBuffer(vlen + flen);

    var i, j;

    var view = new Float32Array(buf);
    for (i = 0; i < mesh.verts.length; i++) {
        j = 3 * i;
        view[j] = mesh.verts[i].coord.x;
        view[j + 1] = mesh.verts[i].coord.y;
        view[j + 2] = mesh.verts[i].coord.z;
    }

    view = new Uint32Array(buf);
    for (i = 0; i < mesh.faces.length; i++) {
        j = 3 * i + 3 * mesh.verts.length;
        var edge = mesh.faces[i].edge;
        view[j] = edge.vert.id;
        view[j + 1] = edge.next.vert.id;
        view[j + 2] = edge.next.next.vert.id;
    }

    return buf;
}