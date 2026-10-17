# A generated mesh brought down to a few thousand triangles, to be drawn: small.py in.obj out.obj [faces]
import sys
import trimesh, fast_simplification
m = trimesh.load(sys.argv[1])
most = int(sys.argv[3]) if len(sys.argv) > 3 else 1800
v, f = fast_simplification.simplify(m.vertices.astype("float32"), m.faces.astype("int32"), target_reduction=1 - most / len(m.faces))
trimesh.Trimesh(v, f).export(sys.argv[2])
