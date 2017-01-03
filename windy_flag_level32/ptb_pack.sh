#!/bin/bash
for filename in obj/*.ptb; do
	./ptb_pack $filename
done

