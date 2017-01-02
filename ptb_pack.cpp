#include <iostream>
#include <fstream>
#include <arithmetic_codec.h>
#define AC_BUFFER 1024 * 10000

void Calculate_Geometry_Offset_Range() {
    for (int Component_ID = 0; Component_ID < this->NumberComponents; Component_ID++) {
        list<int>::iterator Number_iterator = this->NumberVertices[Component_ID].begin();
        list<Point_Int>::iterator Vertex_iterator = this->Geometry[Component_ID].begin();

        unsigned Number_phases = this->NumberVertices[Component_ID].size();


        for (unsigned i = 0; i < Number_phases; i++) {
            int Number_vertices_layer = *Number_iterator;
            Number_iterator++;

            int alpha_max = -10000;
            int alpha_min = 10000;
            int gamma_max = -10000;
            int gamma_min = 10000;
            int alpha = 0, beta = 0, gamma = 0;


            if (Number_vertices_layer != 0) {
                for (int j = 0; j < Number_vertices_layer; j++) {
                    alpha = Vertex_iterator->x;
                    if (alpha > alpha_max)
                        alpha_max = alpha;
                    if (alpha < alpha_min)
                        alpha_min = alpha;

                    beta = Vertex_iterator->y;
                    if (beta > alpha_max)
                        alpha_max = beta;
                    if (beta < alpha_min)
                        alpha_min = beta;

                    gamma = Vertex_iterator->z;
                    if (gamma > gamma_max)
                        gamma_max = gamma;
                    if (gamma < gamma_min)
                        gamma_min = gamma;

                    Vertex_iterator++;
                }

                this->AlphaRange[Component_ID].push_back(alpha_max - alpha_min + 1);
                this->AlphaOffset[Component_ID].push_back(-alpha_min);

                this->GammaRange[Component_ID].push_back(gamma_max - gamma_min + 1);
                this->GammaOffset[Component_ID].push_back(-gamma_min);
            } else {
                this->AlphaRange[Component_ID].push_back(0);
                this->AlphaOffset[Component_ID].push_back(0);

                this->GammaRange[Component_ID].push_back(0);
                this->GammaOffset[Component_ID].push_back(0);
            }
        }
    }



    /* Calculate alpha_min and gamma_min of all coefficients
   * in order to prevent negative symbols.Compression is not possible. */
    list<int>::iterator it_gamma, it_alpha;
    for (int Component_ID = 0; Component_ID < this->NumberComponents; Component_ID++) {
        for (it_alpha = this->AlphaOffset[Component_ID].begin();
             it_alpha != this->AlphaOffset[Component_ID].end(); it_alpha++) {
            if (*it_alpha < this->Smallest_Alpha)
                this->Smallest_Alpha = *it_alpha;
        }
        for (it_gamma = this->GammaOffset[Component_ID].begin();
             it_gamma != this->GammaOffset[Component_ID].end(); it_gamma++) {
            if (*it_gamma < this->Smallest_Gamma)
                this->Smallest_Gamma = *it_gamma;
        }
    }


    if (this->IsColored) {

        int C0_min = 50000, C1_min = 50000, C2_min = 50000;
        int C0_max = -50000, C1_max = -50000, C2_max = -50000;

        for (int Component_ID = 0; Component_ID < this->NumberComponents; Component_ID++) {
            //#ifdef PREDICTION_METHOD
            list<Color_Unit>::iterator Vertex_color_iterator;
            for (Vertex_color_iterator = this->VertexColor[Component_ID].begin();
                 Vertex_color_iterator != this->VertexColor[Component_ID].end(); Vertex_color_iterator++)
                //#endif
            {
                if (Vertex_color_iterator->c0 < C0_min)
                    C0_min = Vertex_color_iterator->c0;
                if (Vertex_color_iterator->c0 > C0_max)
                    C0_max = Vertex_color_iterator->c0;

                if (Vertex_color_iterator->c1 < C1_min)
                    C1_min = Vertex_color_iterator->c1;
                if (Vertex_color_iterator->c1 > C1_max)
                    C1_max = Vertex_color_iterator->c1;

                if (Vertex_color_iterator->c2 < C2_min)
                    C2_min = Vertex_color_iterator->c2;
                if (Vertex_color_iterator->c2 > C2_max)
                    C2_max = Vertex_color_iterator->c2;
            }

        }


        this->C0_Range = C0_max - C0_min + 1;
        this->C1_Range = C1_max - C1_min + 1;
        this->C2_Range = C2_max - C2_min + 1;

        if (this->C0_Range <= 1) this->C0_Range = 2;
        if (this->C1_Range <= 1) this->C1_Range = 2;
        if (this->C2_Range <= 1) this->C2_Range = 2;

        this->Smallest_C0 = C0_min;
        this->Smallest_C1 = C1_min;
        this->Smallest_C2 = C2_min;
    }
}




int main(int argc, char **argv) {
	if (argc != 2) {
		cout << "Usage: " << argv[0]
             << "input.ptb" << endl;
        exit(1);
	}
	
	const char *input_name = argv[1];
	


	return 0;
}
