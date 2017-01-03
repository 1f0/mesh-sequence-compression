#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <arithmetic_codec.h>
#define AC_BUFFER 1024 * 10000

using namespace std;

int Qbit = 8;

class Axis{
public:
    vector<float> orig;
    vector<int> quant;
    int qbit;
    int range;
    float step, min;
};

int main(int argc, char **argv) {
    if (argc != 2) {
        cout << "Usage: " << argv[0]
             << " input.ac" << endl;
        exit(1);
    }

    const char *input_name = argv[1];
    FILE* fin = fopen(input_name, "rb");
    Axis axis3[3];
    int num, a;
    
    a = fread(&num, sizeof(int), 1, fin);
    for(int i=0; i<3; i++){
        a = fread(&axis3[i].qbit, sizeof(int), 1, fin);
        a = fread(&axis3[i].min, sizeof(float), 1, fin);
        a = fread(&axis3[i].step, sizeof(float), 1, fin);
    }

    Arithmetic_Codec dec(AC_BUFFER);
    dec.set_buffer(AC_BUFFER);
    dec.read_from_file(fin);

    for(int i=0; i<3; i++){
        for(int j=0; j<num; j++){
            cout << dec.get_bits(axis3[i].qbit) <<endl;
        }
    }

    fclose(fin);

    return 0;
}

