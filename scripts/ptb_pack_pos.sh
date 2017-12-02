#!/bin/bash
for filename in obj/*.pos; do
	./ptb_pack $filename
done

