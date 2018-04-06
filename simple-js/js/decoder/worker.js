'use strict';

importScripts(
    "../viewer/three.js",
    "constant.js",
    "debug_log.js",
    "arithmetic_codec.js",
    "half_edge.js",
    "decompress.js",
    "unsimplify.js",
    "ptb_decoder.js",
    "subdivide.js"
);

function geometryToArrayBuffer(geo) {
    var vlen = geo.vertices.length * 4 * 3;
    var flen = geo.faces.length * 4 * 3;

    var buf = new ArrayBuffer(vlen + flen);

    var i, j;

    var view = new Float32Array(buf);
    for (i = 0; i < geo.vertices.length; i++) {
        j = 3 * i;
        view[j] = geo.vertices[i].x;
        view[j + 1] = geo.vertices[i].y;
        view[j + 2] = geo.vertices[i].z;
    }

    view = new Uint32Array(buf);
    for (i = 0; i < geo.faces.length; i++) {
        j = 3 * i + 3 * geo.vertices.length;
        view[j] = geo.faces[i].a;
        view[j + 1] = geo.faces[i].b;
        view[j + 2] = geo.faces[i].c;
    }

    return buf;
}

function updatedBuffer(geo){
    var buf = new ArrayBuffer(geo.vertices.length * 3 * 4);
    var view = new Float32Array(buf);
    var length = geo.vertices.length;
    for(var i=0;i<length;i++){
        view[i] = geo.vertices[i].x;
        view[i+length] = geo.vertices[i].y;
        view[i+2*length] = geo.vertices[i].z;
    }
    return buf;
}

var frameNum = 0;
var interval = 100;
var refineGeometry = {};

function timedCount() {
    var url;
    var xhr = new XMLHttpRequest();
    if (frameNum === 0) {
        url = location.origin + "/data/0000.p3d";
        xhr.addEventListener("load", function () {
            var recvBuffer = this.response;
            outputInfo("Total length", recvBuffer.byteLength);

            var decoder = new Decompression(recvBuffer);
            decoder.decodeProcess();

            phongTessellationInit(decoder.mesh, refineGeometry);

            var msg = {
                type: 0,
                v_len: refineGeometry.newGeo.vertices.length,
                f_len: refineGeometry.newGeo.faces.length,
                buf: geometryToArrayBuffer(refineGeometry.newGeo)
            };
            postMessage(msg);
            setTimeout("timedCount()", interval);
        });
        frameNum = 1;
    }
    else {
        url = location.origin + "/data/" + frameNum + ".pos.ac";
        //noinspection JSAnnotator
        function callback(count) {
            return function () {
                var recvBuffer = this.response;
                var ptbDecoder = new PtbDecoder(recvBuffer);
                ptbDecoder.readHeader();
                ptbDecoder.updateOldPosition(refineGeometry.newGeo);

                phongTessellationInterpolation(refineGeometry);
                var buff = updatedBuffer(refineGeometry.newGeo);

                var msg = {
                    type: count,
                    buf: buff
                };

                postMessage(msg);
                setTimeout("timedCount()", interval);
            }
        }

        xhr.addEventListener("load", callback(frameNum));
        frameNum++;
        if (frameNum > 128) frameNum = 1;
    }

    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.send();
}

timedCount();
