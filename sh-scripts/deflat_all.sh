#!/bin/bash
if [ -z $1 ];then
	exit
elif [ -d $1 ];then
	cd $1
	echo cd "$(pwd)"
else
	echo usage: "$0" input_dir
	exit
fi

FILECNT=$(find . | wc -l)
ZIPLIST=""

for (( i=0; i<$FILECNT; i++ ));do
	FILENAME=$(printf "%04d_00.drc" $i)
	ZIPLIST="$ZIPLIST $FILENAME"

	if (( i%24 == 23 ));then
		FRNUM=$(( i/24 ))
		zip -R "z$FRNUM.zip" $ZIPLIST
		echo Compress list: $ZIPLIST
		echo Compress frame: $FRNUM
		ZIPLIST=""
	fi
done

FRNUM=$(( i/24 ))
zip -R "z$FRNUM.zip" $ZIPLIST
echo Compress list: $ZIPLIST
echo Compress frame: $FRNUM
