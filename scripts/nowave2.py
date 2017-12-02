#!/usr/bin/python

def readObj(fname):
    f = open(fname)
    verts = []
    for line in f:
        coords = line.split()
        if coords[0] != 'v':
            break
        verts.append((float(coords[1]), float(coords[2]), float(coords[3])))
    f.close()
    return verts

directory = 'windy_flag_level128'

vert_map = []
f_map = open(directory + '/0000_00.obj.map')
for line in f_map:
    vert_map.append(int(line))

def shuffle(arr):
    new_arr = []    
    for m in vert_map:
        new_arr.append(arr[m-1])
    return new_arr

from array import array
def write_to_file(verts, fout):
    for vert in verts:
        float_array = array('f', vert)
        float_array.tofile(fout)

for i in xrange(129):
    name_in = directory + '/%04d_00.obj' % (i)
    print name_in
    verts = readObj(name_in)

    name_out = directory + '/%d.pos' % (i)
    fout = open(name_out, 'wb')

    verts = shuffle(verts)

    write_to_file(verts, fout)
