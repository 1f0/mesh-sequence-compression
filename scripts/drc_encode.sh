#!/bin/bash
BASEDIR=$(dirname "$0")
for file in $1/*.obj;do
	"$BASEDIR/draco_encoder" -i "$file" -o "${file%.*}.drc"
done

