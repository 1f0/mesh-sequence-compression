#!/bin/sh
if [ -d $1 ];then
	cd $1
	pwd
fi

sed -i -- '/vt\s.*/d' ./*.obj
sed -i -- '/ny\s.*/d' ./*.obj
sed -i -- '/nv\s.*/d' ./*.obj
sed -i -- 's/\/[0-9]*//g' ./*.obj
