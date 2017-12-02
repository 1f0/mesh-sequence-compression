#! /bin/sh
for filename in ./obj/*.obj
do
    ./pack15q "$filename" "${filename%.*}.p3d" 100 
done
