/**
 * Created by mangyo on 1/5/17.
 */
'use strict';
//! @param: mesh half_edge mesh,
//! @brief quasi-developable surface
function subdivideMeshQDS(mesh) {

}

function copyFacesFromHfmesh(mesh, arr){
    for (var i = 0; i < mesh.faces.length; i++) {
        var face = mesh.faces[i];
        var a = face.edge.vert.id;
        var b = face.edge.next.vert.id;
        var c = face.edge.next.next.vert.id;
        arr.push(new THREE.Face3(a, b, c));
    }
}

function makeGeometryFromHfmesh(mesh, geo){
    for (var i = 0; i < mesh.verts.length; i++) {
        geo.vertices.push(mesh.verts[i].coord);
    }
    copyFacesFromHfmesh(mesh, geo.faces);
}

//!@param: face f, vertices verts
function ptCalcCenter(f, verts, center){
    center.set(0,0,0);
    for(var j=0; j<3;j++)
        center.add(verts[j]);

    center.multiplyScalar(1/3);

    var mapVert = new THREE.Vector3();
    var sum = new THREE.Vector3();

    // u = v = w = 1/3
    for(j=0; j<3;j++){
        mapVert.subVectors(center, verts[j]);
        var tmp = mapVert.dot(f.vertexNormals[j]);
        mapVert.copy(f.vertexNormals[j]);
        mapVert.multiplyScalar(-tmp);
        mapVert.add(center);
        sum.add(mapVert);
    }

    var alpha = 3/4;

    sum.multiplyScalar(alpha / 3);
    center.multiplyScalar(1-alpha);
    center.add(sum);

    return center;
}

function calcNewGeometry(mesh, geo) {
    makeGeometryFromHfmesh(mesh, geo);

    geo.computeFaceNormals();
    geo.computeVertexNormals();

    var originLength = geo.faces.length;

    for(var i=0; i<originLength; i++){
        var f = geo.faces[i];
        var verts = [geo.vertices[f.a], geo.vertices[f.b], geo.vertices[f.c]];
        var center = new THREE.Vector3(0,0,0);
        ptCalcCenter(f, verts, center);
        geo.vertices.push(center);
    }

    var originVerticesNum = mesh.verts.length;

    for(i=0; i<originLength; i++){
        var edge = mesh.faces[i].edge;
        var flag = true;
        for(var j = 0; j<3;j++) {
            if(edge.isBorderEdge()){
                edge = edge.next;
                continue;
            }
            if(flag){
                geo.faces[i].a = edge.oppo.vert.id;
                geo.faces[i].b = mesh.faces.indexOf(edge.oppo.face) + originVerticesNum;
                geo.faces[i].c = i + originVerticesNum;
                flag = false;
            }else {
                var a = edge.oppo.vert.id;
                var b = mesh.faces.indexOf(edge.oppo.face) + originVerticesNum;
                geo.faces.push(new THREE.Face3(a, b, i + originVerticesNum));
            }
            edge = edge.next;
        }
    }
}

function phongTessellationInit(mesh, geoObject) {
    geoObject.oldFaces = [];
    copyFacesFromHfmesh(mesh, geoObject.oldFaces);

    geoObject.newGeo = new THREE.Geometry();
    calcNewGeometry(mesh, geoObject.newGeo);
}

function phongTessellationInterpolation(geoObject){
    var geo = geoObject.newGeo;
    var end = geo.vertices.length;
    var start = end - geoObject.oldFaces.length;
    
    var oldGeo = new THREE.Geometry();

    oldGeo.vertices = geoObject.newGeo.vertices.slice(0, start);
    oldGeo.faces = geoObject.oldFaces;

    oldGeo.computeFaceNormals();
    oldGeo.computeVertexNormals();

    for(var i=start; i<end; i++){
        var f = oldGeo.faces[i-start];
        var verts = [geo.vertices[f.a], geo.vertices[f.b], geo.vertices[f.c]];
        ptCalcCenter(f, verts, geo.vertices[i]);
    }
}

//! @param: mesh half_edge mesh,
//! @brief Phong tessellation and subdivision shading
function subdivideMeshPTSS(mesh) {


}