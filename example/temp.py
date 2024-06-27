import urllib.request

l = []
with open('out.txt', 'r') as f:
    while True:
        line = f.readline()
        if not line.strip():
            break 
        
        l.append(line.strip())

e = ""
for f in l:
    e += f"file '{f}'\n"

with open('filelist.txt', 'w') as f:
    f.write(e)