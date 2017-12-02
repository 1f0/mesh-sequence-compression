#!/usr/bin/python
import os
path = './windy_flag_level128'
for fn in os.listdir(path):
	fn = os.path.join(path, fn)
	if fn.endswith('.obj'):
		print fn
		lines = []
		with open(fn) as f:
			for line in f:
				if line.startswith('v ') or line.startswith('f '):
					lines.append(line)
		
		with open(fn, "w") as f:
			f.writelines(lines)
