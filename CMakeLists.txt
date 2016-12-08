cmake_minimum_required(VERSION 3.5)
set(PRJ_NAME meshZip)
project(${PRJ_NAME})

set(CMAKE_CXX_STANDARD 11)

set(CMAKE_AUTOMOC ON)

find_package(Qt4 REQUIRED QtCore)
include_directories(Qt4::QtCore)

set(SOURCE_FILES main.cpp compression/Compression_Valence_Component.h compression/Compression_Valence_Component.cpp)
add_executable(${PRJ_NAME} ${SOURCE_FILES})

target_link_libraries(${PRJ_NAME} Qt4::QtCore)

include_directories(compression)
include_directories(compression/polyhedron)

add_subdirectory(compression)