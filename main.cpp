#include <iostream>
#include "compression/Compression_Valence_Component.h"
#include <fstream>
using namespace std;
map<Vertex*, int> vertexIndex;
vector<int> permulation;
int write_num;

int main(int argc, char **argv) {
    if (1) {
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
    } else { // compression
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
        bool is_bijection_selected = true;

        PolyhedronPtr mesh_ptr(new Polyhedron());
        mesh_ptr->load_mesh_obj(input_file_name);

		//set permulation
		write_num = mesh_ptr->size_of_vertices();
		permulation.resize(write_num);
		
        // set map
        Vertex_iterator pVertex = NULL;
        int i = 0;
        for (pVertex = pMesh.vertices_begin(); pVertex != pMesh.vertices_end(); i++, pVertex++) {
            cout << i << " " << pVertex->point().x()
                << " " << pVertex->point().y()
                << " " << pVertex->point().x();
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
    }

    return 0;
}

