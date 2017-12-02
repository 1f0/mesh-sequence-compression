#!/bin/bash
for filename in windy_flag_level128/*.pos; do
	./ptb_pack $filename
done

