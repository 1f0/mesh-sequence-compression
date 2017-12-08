#!/bin/bash
for file in $1/*.obj;do
	"draco_encoder" -i "$file" -o "${file%.*}.drc"
done
