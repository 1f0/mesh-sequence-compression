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

base_verts = readObj('obj/0000_00.obj')
def diffVert(a, b):
    return tuple(x-y for x,y in zip(a,b))

vert_map = []
f_map = open('obj/0000_00.obj.map')
for line in f_map:
    vert_map.append(int(line))

def shuffle(arr):
    new_arr = []    
    for m in vert_map:
        new_arr.append(arr[m-1])
    return new_arr

from array import array
def write_to_file(diff_verts, fout):
    for vert in diff_verts:
        float_array = array('f', vert)
        float_array.tofile(fout)

for i in xrange(32):
    name_in = 'obj/%04d_00.obj' % (i+1)
    print name_in
    verts = readObj(name_in)

    name_out = 'obj/%d.ptb' % (i+1)
    fout = open(name_out, 'wb')

    diff_verts = tuple(diffVert(a,b) for a,b in zip(verts, base_verts))
    diff_verts = shuffle(diff_verts)

    write_to_file(diff_verts, fout)
    base_verts = verts

# loop back
verts = readObj('obj/0000_00.obj')
fout = open('obj/0.ptb', 'wb')
diff_verts = tuple(diffVert(a,b) for a,b in zip(verts, base_verts))
write_to_file(diff_verts, fout)


    
