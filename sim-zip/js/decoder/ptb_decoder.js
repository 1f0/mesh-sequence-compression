'use strict';
function PtbDecoder(buffer) {
    this.decoder = new ArithmeticDecoder(buffer);
    this.vertNum = 0;
    this.axis3 = [];
}

PtbDecoder.prototype.readHeader = function () {
    this.vertNum = this.decoder.bytes2integer(this.decoder.getbytes(4));
    this.buf = new ArrayBuffer(this.vertNum * 3 * 4);
    for (var i = 0; i < 3; i++) {
        this.axis3.push({});
        this.axis3[i].qbit = this.decoder.bytes2integer(this.decoder.getbytes(4));
        this.axis3[i].min = this.decoder.bytes2float(this.decoder.getbytes(4));
        this.axis3[i].step = this.decoder.bytes2float(this.decoder.getbytes(4));
    }

    //!TODO remove this code_bytes computation in both encoder and decoder
    var shift = 0;
    do {
        var file_byte = this.decoder.getc();
        if (file_byte === undefined) alert("error in decoder");

        var tmp = (file_byte & 0x7F) << shift;
        this.code_bytes |= tmp;
        shift += 7;
    } while (file_byte & 0x80);
};

// about to remove
PtbDecoder.prototype.readAxis3 = function () {
    this.decoder.initial();
    var view = new Float32Array(this.buf);
    for (var i = 0; i < 3; i++) {
        var axi = this.axis3[i];
        var base = i * this.vertNum;
        for (var j = 0; j < this.vertNum; j++) {
            var h = this.decoder.getBits(axi.qbit);
            view[base + j] = h * axi.step + axi.min;
        }
    }
};

PtbDecoder.prototype.updateOldPosition = function (geo) {
    this.decoder.initial();
    var view = new Float32Array(this.buf);
    for (var i = 0; i < 3; i++) {
        var axi = this.axis3[i];
        for (var j = 0; j < this.vertNum; j++) {
            var h = this.decoder.getBits(axi.qbit);
            if(i===0)
                geo.vertices[j].x = h * axi.step + axi.min;
            else if(i===1)
                geo.vertices[j].y = h * axi.step + axi.min;
            else
                geo.vertices[j].z = h * axi.step + axi.min;
        }
    }
}
