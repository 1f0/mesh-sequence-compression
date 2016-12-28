cmake_minimum_required(VERSION 3.5)
set(PRJ_NAME meshZip)
project(${PRJ_NAME})

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES main.cpp
        compression/Compression_Valence_Component.cpp
        compression/Processing_Kai.cpp
        compression/arithmetic_codec.cpp
        compression/polyhedron/mesh.cpp)
add_executable(${PRJ_NAME} ${SOURCE_FILES})

set(CMAKE_AUTOMOC ON)
find_package(Qt4 REQUIRED QtCore)
include_directories(Qt4::QtCore)

find_package(CGAL COMPONENTS Core)
INCLUDE(${CGAL_USE_FILE})

find_package(OpenGL REQUIRED)
include_directories(${OPENGL_INCLUDE_DIR})

# link external library
target_link_libraries(${PRJ_NAME} Qt4::QtCore)
target_link_libraries(${PRJ_NAME} ${CGAL_LIBRARIES} ${CGAL_3RD_PARTY_LIBRARIES})
target_link_libraries(${PRJ_NAME} ${OPENGL_gl_LIBRARY} ${OPENGL_glu_LIBRARY})

# similiar to "gcc -l", search head file
include_directories(compression)
include_directories(compression/polyhedron)

# add source files
add_subdirectory(compression)
add_subdirectory(compression/polyhedron)
