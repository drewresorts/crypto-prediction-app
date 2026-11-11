"""Inline every script into one self-contained HTML file: dist/quay-quest.html.
usage: python3 tools/build_single.py"""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html')).read()
def inline(m):
    src = open(os.path.join(root, m.group(1))).read().replace('</script', '<\\/script')
    return '<script>\n' + src + '\n</script>'
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
open(os.path.join(root, 'dist', 'quay-quest.html'), 'w').write(out)
print('dist/quay-quest.html', len(out), 'bytes')
