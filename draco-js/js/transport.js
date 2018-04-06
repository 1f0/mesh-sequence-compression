/**
 * Created by mangyo on 2/28/17.
 */
'use strict';

importScripts(
    "jszip.min.js"
);

let fileGroup = [];
let zipNum = 0;

timedCount();

function timedCount() {
    const url = location.origin + "/data/z" + zipNum + ".zip";
    let xhr = new XMLHttpRequest();

    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.send();

    xhr.onload = function (e) {
        let newZip = new JSZip();
        newZip.loadAsync(this.response)
            .then(function (zip) {
                fileGroup[zipNum] = zip;
                zipNum++;
                if(zipNum < 17)
                    setTimeout("timedCount()", 0);
            }).catch(function (reason) {
            console.log(reason);
        });
    };
}

onmessage = function (e) {
    console.log(e.data);
    console.log(fileGroup.length);

    if(e.data.frameNum >= fileGroup.length*24){
        postMessage({
            status:'fail'
        });
    }else{
        let str = "" + e.data.frameNum;
        let pad = "0000";
        let ans = pad.substring(0, pad.length - str.length) + str + "_00.drc";
        let fIndex = Math.floor(e.data.frameNum / 24);

        fileGroup[fIndex].file(ans).async("uint8array").then(function(data){
            postMessage({
                recv:"w1",
                status:'success',
                data:data
            })
        }).catch(function (reason) {
            console.log(reason);
        });
    }
};

