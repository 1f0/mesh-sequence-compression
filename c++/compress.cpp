#include <iostream>
#include "compression/Compression_Valence_Component.h"
#include <fstream>

using namespace std;
map<Point3d *, int> vertexIndex;
vector<int> permulation;
int write_num;

int main(int argc, char **argv) {
    if (argc != 4) {
        cout << "Usage: " << argv[0]
             << " Input_file[obj] Output_file[p3d] Remain_V_Num" << endl;
        exit(1);
    }

    char *input_file_name = argv[1];
    char *output_file_name = argv[2];
    int q_bit = 10;

    int n_vertices;
    sscanf(argv[3], "%d", &n_vertices);

    bool is_normal_flipping_selected = false;
    bool is_use_metric_selected = false;
    float metric_thread = 0;
    bool is_use_forget_metric_selected = false;
    int forget_value = 0;
    bool is_compression_selected = true;
    bool is_adaptive_quantization_selected = false;
    bool is_bijection_selected = false;

    PolyhedronPtr mesh_ptr(new Polyhedron());
    mesh_ptr->load_mesh_obj(input_file_name);

    //set permulation
    write_num = mesh_ptr->size_of_vertices();
    permulation.resize(write_num);

    // set map
    Vertex_iterator pVertex = NULL;
    int i = 0;
    for (pVertex = mesh_ptr->vertices_begin(); pVertex != mesh_ptr->vertices_end(); i++, pVertex++) {
        //cout << i << " " << pVertex->point().x()
        //    << " " << pVertex->point().y()
        //    << " " << pVertex->point().z()<<endl;
        vertexIndex[&(pVertex->point())] = i;
    }

    Compression_Valence_Component cv(mesh_ptr);
    cout << cv.Main_Function(
            *mesh_ptr,
            input_file_name,
            output_file_name,
            q_bit,
            n_vertices,
            is_normal_flipping_selected,
            is_use_metric_selected,
            metric_thread,
            is_use_forget_metric_selected,
            forget_value,
            is_compression_selected,
            is_adaptive_quantization_selected,
            is_bijection_selected
    ).toStdString() << endl;

    ofstream fout(string(input_file_name) + ".map");
    for (int i = 0; i < permulation.size(); i++)
        fout << permulation[i] + 1 << endl;
    fout.close();

    return 0;
}

