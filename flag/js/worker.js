/**
 * Created by mangyo on 2/22/17.
 */
'use strict';

importScripts(
    "three.min.js",
    "draco_decoder.js",
    "DRACOLoader.js"
);

let fileDisplayArea = {innerText: ''};
let frameNum = 0;
let interval = 40;
let frameAmount = 394;
let w2;

startWorker();
timedCount();

function startWorker(){
    w2 = new Worker("worker2.js");
    w2.onmessage = function(e){
        if (e.data.status === 'success') {
            const dracoLoader = new THREE.DRACOLoader();
            let mix = dracoLoader.decodeDracoFile(e.data.data);
            console.log(fileDisplayArea.innerText);
            postMessage(mix);//, [mix.indices.buffer, mix.vertices.buffer, mix.colors.buffer, mix.normals.buffer, mix.uvs.buffer]);
            frameNum = (frameNum + 1) % frameAmount;
        }
        setTimeout("timedCount()", interval);
    }
}

function timedCount() {
    w2.postMessage({
        frameNum: frameNum
    });
}

onmessage = function (e) {
    if(e.data.cmd === 'end'){
        w2.terminate();
        close();
    }
};


