#!/usr/bin/python
import sys

def read_obj(fname):
	geo = []
	with open(fname, 'r') as f:
		for line in f:
			content = line.split()
			if content[0] == 'v':
				geo.append(map(float, content[1:4]))
	return geo

def diff_geo(old, new):
	diff = []
	for x in zip(old, new):
		diff.append(map(lambda a,b:a-b, x[0], x[1]))
	return diff

def write_obj(arr, fname):
	with open(fname, 'w') as f:
		for x in arr:
			f.writelines('v %f %f %f\n' % (x[0], x[1], x[2]))

def main(argv):
	if(len(argv) != 4):
		print('usage: %s old.obj new.obj diff_name' % argv[0])
		return
	old_geo = read_obj(argv[1])
	new_geo = read_obj(argv[2])
	diff = diff_geo(old_geo, new_geo)
	write_obj(diff, argv[3])

if __name__ == "__main__":
	main(sys.argv)
