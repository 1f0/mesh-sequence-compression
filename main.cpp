/*! @file main.cpp
 *  @brief apply compression on mesh to generate LoD
 */
#include <iostream>

#include <Compression_Valence_Component.h>

using namespace std;

int main(int argc, char** argv)
{
    if (argc != 4)
    {
        std::cout << "Usage: " << argv[0]
                  << " Input_file Output_file Remain_V_Num" << std::endl;
        exit(1);
    }

    char* input_file_name = argv[1];
    char* output_file_name = argv[2];
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
    mesh_ptr->load_mesh_obj(filename);

    Compression_Valence_Component cv(mesh_ptr);
    cv.Main_Function(
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
    );

    return 0;
}

