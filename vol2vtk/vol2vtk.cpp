#include <iostream>
#include <string>
#include <vector>
#include <fstream>

int vol2tet(const std::string& filename,
            std::vector<size_t>& tet,
            std::vector<double>& verts)
{
  std::ifstream ifs(filename.c_str());
  if(ifs.fail()){
	std::cerr << "# [ ERROR ] can not open vol file." << std::endl;;
	return __LINE__;
  }
  
  std::string line;
  while(!ifs.eof()){
	getline(ifs, line);
	if(line  == "dimension") {
	  size_t d = 0 ;
	  ifs >> d;
	  if(d != 3){
		std::cerr << "# [ERROR] dimesnsion is " << d << ", not 3." << std::endl;;
        return __LINE__;
	  }
	}

    if(line == "geomtype"){
        size_t geo_t = 0;
        ifs >> geo_t;
        if(geo_t != 11){
            std::cerr << "# [ERROR] geomtye is " << geo_t << ", not 11." << std::endl;;
            return __LINE__;
        }
    }

    if(line[0] == '#'){
      ifs >> line;
      if(line == "volumeelements"){
        size_t tet_num = 0;
        ifs >> tet_num;
        tet.resize(4*tet_num);
        size_t trash;
        for(size_t ti = 0; ti < tet_num; ++ti){
          ifs >> trash >> trash;
          for(size_t di = 0; di < 4; ++di) {
            ifs >> tet[4*ti+di];
          }
        }
        for (size_t i=0; i<tet.size(); ++i) --tet[i];
      }

      if(line == "points"){
        size_t point_num;
        ifs >> point_num;
        verts.resize(3*point_num);
        for(size_t pi = 0; pi < point_num; ++pi)
          for(size_t di = 0; di < 3; ++di) {
            ifs >> verts[3*pi+di];
          }
      }
    }
  }
  return 0;
}

template <typename OS, typename FLOAT, typename INT>
void tet2vtk(
    OS &os,
    const FLOAT *node, size_t node_num,
    const INT *tet, size_t tet_num)
{
    os << "# vtk DataFile Version 2.0\nTET\nASCII\n\nDATASET UNSTRUCTURED_GRID\n";
    os << "POINTS " << node_num << " float\n";
    for(size_t i = 0; i < node_num; ++i)
        os << node[i*3+0] << " " << node[i*3+1] << " " << node[i*3+2] << "\n";

    os << "CELLS " << tet_num << " " << tet_num*5 << "\n";
    for(size_t i = 0; i < tet_num; ++i)
        os << 4 << "  "
           << tet[i*4+0] << " " << tet[i*4+1] << " "
           << tet[i*4+2] << " " << tet[i*4+3] << "\n";
    os << "CELL_TYPES " << tet_num << "\n";
    for(size_t i = 0; i < tet_num; ++i)
        os << 10 << "\n";
}

int vol2vtk(const std::string& in_vol, const std::string& out_vtk)
{
  std::vector<size_t> tet;
  std::vector<double> verts;
  
  if (vol2tet(in_vol, tet, verts)){ std::cout << "ERROR" << std::endl; return 1;}

  for (size_t i=0; i<tet.size(); i+=4) {
    std::swap(tet[i+1], tet[i+2]);
  }

  std::ofstream outf(out_vtk.c_str());
  if (outf.fail()){ std::cout << "can not open vtk file." << std::endl;  return 1;}

  tet2vtk(outf, &verts[0], verts.size()/3, &tet[0], tet.size()/4);
  outf.close();

  return 0;
}



int main(int argc, char* argv[])
{
  std::string in_vol = argv[1];
  std::string out_vtk = argv[2];

  return vol2vtk(in_vol, out_vtk);

  return 0;
}
