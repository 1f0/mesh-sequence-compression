//constant variables in class
var AC__MinLength = 0x01000000;
var AC__MaxLength = 0xFFFFFFFF;

var BM__LengthShift = 13; // length bits discarded before mult.
var BM__MaxCount = 1 << BM__LengthShift; // for adaptive models
var DM__LengthShift = 15; // length bits discarded before mult.
var DM__MaxCount = 1 << DM__LengthShift; // for adaptive models

function AdaptiveDataModel(number_of_symbols) {
    this.distribution = [];
    this.symbol_count_bias = undefined;
    this.decoder_table_bias = undefined;

    this.total_count = 0;
    this.update_cycle = 0;
    this.symbols_until_update = 0;

    this.data_symbols = 0;
    this.last_symbol = 0;
    this.table_size = 0;
    this.table_shift = 0;

    if (typeof number_of_symbols !== "undefined")
        this.set_alphabet(number_of_symbols);
}
AdaptiveDataModel.prototype.get_symbol_count = function (index) {
    return this.distribution[index + this.symbol_count_bias];
};

AdaptiveDataModel.prototype.set_symbol_count = function (index, value) {
    this.distribution[index + this.symbol_count_bias] = value;
};

AdaptiveDataModel.prototype.get_decoder_table = function (index) {
    return this.distribution[index + this.decoder_table_bias];
};

AdaptiveDataModel.prototype.set_decoder_table = function (index, value) {
    this.distribution[index + this.decoder_table_bias] = value;
};

AdaptiveDataModel.prototype.set_alphabet = function (number_of_symbols /*unsigned*/) {
    if ((number_of_symbols >>> 0) < 2 || ((number_of_symbols >>> 0) > (1 << 13))) {
        outputInfo("invalid number of data symbols", number_of_symbols);
    }

    if (this.data_symbols !== number_of_symbols) { // assign memory for data model
        this.data_symbols = number_of_symbols;
        this.last_symbol = this.data_symbols - 1;
        // define size of table for fast decoding
        if ((this.data_symbols >>> 0) > 16) {
            var table_bits = 3;
            while ((this.data_symbols >>> 0) > ((1 >>> 0) << (table_bits + 2)))
                ++table_bits;
            this.table_size = (1 << table_bits) + 4;
            this.table_shift = DM__LengthShift - table_bits;

            for (var i = 0; i < 2 * this.data_symbols + this.table_size + 6; i++)
                this.distribution[i] = 0;

            this.decoder_table_bias = 2 * this.data_symbols;
        } else { // small alphabet: no table needed
            this.table_size = this.table_shift = 0;
            for (var i = 0; i < 2 * this.data_symbols; i++)
                this.distribution[i] = 0;
        }
        this.symbol_count_bias = this.data_symbols;
    }
    this.reset(); // initialize model
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AdaptiveDataModel.prototype.update = function (from_encoder) {
    // halve counts when a threshold is reached
    if (((this.total_count += this.update_cycle) >>> 0) > DM__MaxCount) {
        this.total_count = 0;
        for (var n = 0; n < this.data_symbols; n++) {
            this.set_symbol_count(n, (this.get_symbol_count(n) + 1) >>> 1);
            this.total_count += this.get_symbol_count(n);
        }
    }
    // compute acumulative distribution, decoder table, all unsigned
    var k;
    var sum = 0;
    var s = 0;
    var scale = Math.floor(0x80000000 / this.total_count) >>> 0;

    if (from_encoder || (this.table_size === 0)) {
        for (k = 0; k < this.data_symbols; k++) {
            this.distribution[k] = (scale * sum) >>> (31 - DM__LengthShift);
            sum += this.get_symbol_count(k);
        }
    } else {
        for (k = 0; k < this.data_symbols; k++) {
            this.distribution[k] = (scale * sum) >>> (31 - DM__LengthShift);

            sum += this.get_symbol_count(k);
            var w = this.distribution[k] >>> this.table_shift;
            while (s < w) {
                this.set_decoder_table(++s, k - 1);
            }
        }
        this.set_decoder_table(0, 0);
        while (s <= this.table_size) {
            this.set_decoder_table(++s, this.data_symbols - 1);
        }
    }
    // set frequency of model updates
    this.update_cycle = (5 * this.update_cycle) >>> 2;
    var max_cycle = (this.data_symbols + 6) << 3;
    if ((this.update_cycle >>> 0) > (max_cycle >>> 0)) this.update_cycle = max_cycle;
    this.symbols_until_update = this.update_cycle;
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AdaptiveDataModel.prototype.reset = function () {
    if (this.data_symbols === 0) return;

    // restore probability estimates to uniform distribution
    this.total_count = 0;
    this.update_cycle = this.data_symbols;
    for (var k = 0; k < this.data_symbols; k++) this.set_symbol_count(k, 1);
    this.update(false);// using table or not depend on table_size
    this.symbols_until_update = this.update_cycle = (this.data_symbols + 6) >>> 1;
};

//now defined for Uint8Array
//!TODO use template-like strategy to apply this to other type of array
function ArithmeticDecoder(arraybuffer) {
    this.buffer = new Uint8Array(arraybuffer);
    this.cur_pos = 0; //current point in the buffer stream
    this.value = 0; //32 bits temperary buffer, current processing
    this.length = 0; //record fetched bits information
}

ArithmeticDecoder.prototype.getc = function () {
    //if (cur_pos >= arraybuffer.byteLength) will return undefined
    return this.buffer[this.cur_pos++];
};

ArithmeticDecoder.prototype.getbytes = function (num) {
    var res = new Uint8Array(num);
    for (var i = 0; i < num; ++i) {
        res[i] = this.buffer[this.cur_pos + i];
    }
    this.cur_pos += num;
    return res;
};

ArithmeticDecoder.prototype.bytes2integer = function (array) {
    //which byte sequence?
    var res = 0;
    for (var i = 0; i < array.byteLength; ++i)
        res |= (array[i] & 0xFF) << (8 * i);
    return res;
};

ArithmeticDecoder.prototype.bytes2float = function (array) {
    return this.to_float(this.bytes2integer(array));
};

ArithmeticDecoder.prototype.to_float = function (array) {
    var sign = (array & 0x80000000) >>> 31;
    var exp = (array & 0x7F800000) >>> 23; //unsigned integer
    var frac = array & 0x007FFFFF; //unsigned integer
    var tmp = Math.pow(2, 23);
    var res = frac / tmp;
    res *= Math.pow(2, exp - 127);
    res *= Math.pow(-1, sign);
    return (1 + frac / Math.pow(2, 23)) * Math.pow(2, exp - 127) * Math.pow(-1, sign);
};

ArithmeticDecoder.prototype.initial = function () {
    if (this.buffer.byteLength === 0) alert("no code buffer set");

    // initialize decoder: interval, pointer, initial code value
    this.length = AC__MaxLength;
    this.value = (this.buffer[this.cur_pos] << 24) |
        (this.buffer[this.cur_pos + 1] << 16) |
        (this.buffer[this.cur_pos + 2] << 8) |
        (this.buffer[this.cur_pos + 3]);
    this.cur_pos += 3; //this position is counterpart of ac_pointer
};

ArithmeticDecoder.prototype.getBits = function (bits) {
    //s will be a float, so division will generate different result refer to c++
    //use >>> 0 to convert number to unsigned int. and then make comparison
    var s = Math.floor((this.value >>> 0) / (this.length >>>= bits)) >>> 0;
    this.value -= (this.length >>> 0) * s; // update interval
    if ((this.length >>> 0) < AC__MinLength)
        this.renorm_dec_interval(); // renormalization
    return s;
};

ArithmeticDecoder.prototype.renorm_dec_interval = function () {
    do { // read least-significant byte
        this.value = (this.value << 8) | (0xFF & this.buffer[++this.cur_pos]);
        this.length <<= 8;
        if (this.length === 0) {
            throw new Error("Something went badly wrong!");
        }
    } while ((this.length >>> 0) < AC__MinLength);   // compare as UNSIGNED int
    // length multiplied by 256
};

ArithmeticDecoder.prototype.decode = function (M) //Adaptive data model
{
    var n, s, x, m; // unsigned
    var y = this.length; // unsigned

    if (M.table_size > 0) { // use table look-up for faster decoding
        this.length >>>= DM__LengthShift;
        var dv = Math.floor((this.value >>> 0) / this.length); //unsigned
        var t = dv >>> M.table_shift; //unsigned

        s = M.get_decoder_table(t); // initial decision based on table look-up
        n = M.get_decoder_table(t + 1) + 1;

        while ((n >>> 0) > ((s + 1) >>> 0)) { // finish with bisection search
            m = ((s >>> 0) + (n >>> 0)) >>> 1; //unsigned
            if ((M.distribution[m] >>> 0) > (dv >>> 0))
                n = m;
            else s = m;
        }
        // compute products//TODO maybe we should make it >>> 0 to be unsigned
        x = M.distribution[s] * this.length;
        if (s != M.last_symbol)
            y = M.distribution[s + 1] * this.length;
    } else { // decode using only multiplications
        x = s = 0;
        this.length >>>= DM__LengthShift;
        n = M.data_symbols;
        m = n >>> 1; //unsigned
        // decode via bisection search
        do {
            var z = this.length * M.distribution[m]; //unsigned
            if ((z >>> 0) > (this.value >>> 0)) {
                n = m;
                y = z; // value is smaller
            } else {
                s = m;
                x = z; // value is larger or equal
            }
        } while ((m = (s + n) >>> 1) !== s);
    }
    this.value = this.value - x; // update interval
    this.length = y - x;
    if ((this.length >>> 0) < AC__MinLength)
        this.renorm_dec_interval(); // renormalization

    var tmp = M.get_symbol_count(s);
    M.set_symbol_count(s, tmp + 1);
    if ((--M.symbols_until_update) === 0)
        M.update(false); // periodic model update

    return s;
};
