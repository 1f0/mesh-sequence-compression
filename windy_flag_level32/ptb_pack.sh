#!/bin/bash
for filename in ./*.ptb; do
	./ptb_pack $filename
done

