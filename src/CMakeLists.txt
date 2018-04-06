cmake_minimum_required(VERSION 3.5)
set(PRJ_NAME meshZip)
set(COMPRESS pack15q)
set(DECOMPRESS unpack)
project(${PRJ_NAME})

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES compress.cpp
        compression/Compression_Valence_Component.cpp
        compression/arithmetic_codec.cpp
        compression/polyhedron/mesh.cpp)
add_executable(${COMPRESS} ${SOURCE_FILES})

set(SOURCE_FILES2 decompress.cpp
		compression/Compression_Valence_Component.cpp
		compression/arithmetic_codec.cpp
		compression/polyhedron/mesh.cpp)
add_executable(${DECOMPRESS} ${SOURCE_FILES2})

set(SRC2 ptb_pack.cpp
		compression/arithmetic_codec.cpp)
add_executable(ptb_pack ${SRC2}) 

set(SRC3 ptb_unpack.cpp
		compression/arithmetic_codec.cpp)
add_executable(ptb_unpack ${SRC3})

set(CMAKE_AUTOMOC ON)
find_package(Qt4 REQUIRED QtCore)
include_directories(Qt4::QtCore)

find_package(CGAL COMPONENTS Core)
INCLUDE(${CGAL_USE_FILE})

# link external library
target_link_libraries(${COMPRESS} Qt4::QtCore)
target_link_libraries(${COMPRESS} ${CGAL_LIBRARIES} ${CGAL_3RD_PARTY_LIBRARIES})

target_link_libraries(${DECOMPRESS} Qt4::QtCore)
target_link_libraries(${DECOMPRESS} ${CGAL_LIBRARIES} ${CGAL_3RD_PARTY_LIBRARIES})

target_link_libraries(ptb_pack Qt4::QtCore)

# similiar to "gcc -l", search head file
include_directories(compression)
include_directories(compression/polyhedron)

# add source files
add_subdirectory(compression)
add_subdirectory(compression/polyhedron)
