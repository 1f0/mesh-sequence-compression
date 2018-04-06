"use strict";

if (typeof(Worker) === "undefined") {
    console.log('error, webworker is not suppported');
    throw new Error();
}

document.getElementById('stop_btn').addEventListener("click", stopWorker);
document.getElementById('tess').addEventListener("click", function(){
    startWorker();
});

document.getElementById('not_tess').addEventListener("click", function(){
    startWorker();
});


var viewer = new G.Viewer({width: 800, height: 600, dropable: 1});
var w;

function startWorker() {
    w = new Worker("js/decoder/worker.js");
    w.onmessage = function (e) {
        if (e.data.type === 0) {
            viewer.initModel(e.data);
            viewer.loadedHandler();
        } else {
            viewer.updateGeometry(e.data.buf);
            // stopWorker();
        }
    };
}

function stopWorker() {
    w.terminate();
    w = undefined;
}
