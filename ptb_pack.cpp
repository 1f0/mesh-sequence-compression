#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <arithmetic_codec.h>
#define AC_BUFFER 1024 * 10000

using namespace std;

const int Qbit = 5;

class Axis{
public:
    vector<float> orig;
    vector<int> quant;
    int qbit;
    int range;
    float step, min;
};

void quantization(Axis &axi) {
	float max = -50000, min = 50000;//infinity

    for(int i=0; i < axi.orig.size(); i++) {
		if(axi.orig[i] > max) {
            max = axi.orig[i];
        }
        if(axi.orig[i] < min) {
            min = axi.orig[i];
        }
	}
    axi.qbit = Qbit;
    axi.range = (int)powf(2, Qbit);
    float step = (max - min) / axi.range;

    for(int i=0; i < axi.orig.size(); i++) {
        axi.quant.push_back((int)floorf((axi.orig[i]-min)/step));
    }

    axi.min = min;
    axi.step = step;
}

int main(int argc, char **argv) {
	if (argc != 2) {
		cout << "Usage: " << argv[0]
             << "input.ptb" << endl;
        exit(1);
	}
	
	const char *input_name = argv[1];
	FILE* fin = fopen(input_name, "rb");
    Axis axis3[3];
    do{
        float coord;
        fread(&coord, sizeof(float), 1, fin);
        for(int i=0; i<3; i++)
            axis3[i].orig.push_back(coord);
    }while(!feof(fin));
    fclose(fin);

    for(int i=0; i<3; i++)
        quantization(axis3[i]);

    string out_name(input_name);
    out_name += ".ac";
    const char* out_name_c = out_name.c_str();
    FILE* fout = fopen(out_name_c, "wb");

    for(int i=0; i<3; i++){
        fwrite(&axis3[i].qbit, sizeof(int), 1, fout);
        fwrite(&axis3[i].min, sizeof(float), 1, fout);
        fwrite(&axis3[i].step, sizeof(float), 1, fout);
    }

    Arithmetic_Codec enc(AC_BUFFER);
    enc.start_encoder();
    
    Adaptive_Data_Model model[3];
    for(int i=0; i<3; i++)
        model[i].set_alphabet(axis3[i].range);

    cout<<"x_min:"<<axis3[0].min<<endl;
    cout<<"xstep:"<<axis3[0].step<<endl;
    cout<<"y_min:"<<axis3[1].min<<endl;
    cout<<"ystep:"<<axis3[1].step<<endl;
    cout<<"z_min:"<<axis3[2].min<<endl;
    cout<<"zstep:"<<axis3[2].step<<endl;

    for(int j=0; j<axis3[0].quant.size(); j++){
        for(int i=0; i<3; i++){
            enc.encode(axis3[i].quant[j], model[i]);
        }    
    }

    enc.write_to_file(fout);
    fclose(fout);

	return 0;
}

