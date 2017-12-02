#include <iostream>
#include "compression/Compression_Valence_Component.h"
#include <fstream>
using namespace std;
map<Point3d *, int> vertexIndex;
vector<int> permulation;
int write_num;

int main(int argc, char **argv) {
    if (argc != 3) {
        cout << "Usage: " << argv[0]
             << " Input_file[input.p3d] Output_file_Prefix[output]" << endl;
        exit(1);
    }

    const char *input_file_name = argv[1];
    const char *output_file_name = argv[2];

    PolyhedronPtr mesh_ptr(new Polyhedron());

    //Decompression
    Compression_Valence_Component cv(mesh_ptr);
    cv.File_name = string(input_file_name);
    cout << (cv.Decompress_Init(*mesh_ptr)).toStdString() << endl;

    while (cv.Current_level < cv.Total_layer) {
        cv.Current_level = cv.Decompress_Each_Step(*mesh_ptr, cv.File_name.c_str());
    }
    string s(output_file_name);
    char tmp[255];
    sprintf(tmp, "_lv%d.obj", cv.Current_level);
    s += string(tmp);

    ofstream ofs(s.c_str(), ofstream::out);
    size_t index = 0;
    for (Vertex_iterator i = mesh_ptr->vertices_begin(); i != mesh_ptr->vertices_end(); ++i) {
        ofs << "v "
            << i->point().x() << " "
            << i->point().y() << " "
            << i->point().z() << endl;
        i->tag(index++);
    }

    for (Facet_iterator i = mesh_ptr->facets_begin(); i != mesh_ptr->facets_end(); ++i) {
        ofs << "f";
        Halfedge_around_facet_circulator pHalfedge = i->facet_begin();
        do
            ofs << ' ' << pHalfedge->vertex()->tag() + 1;
        while (++pHalfedge != i->facet_begin());
        ofs << endl;
    }

    ofs.close();
    return 0;
}

