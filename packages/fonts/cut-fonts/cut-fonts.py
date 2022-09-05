# import fontTools.subset
# import fontTools.ttLib.woff2
import os

# https://blog.southfox.me/2021/03/%E4%B8%AD%E6%96%87%E7%BD%91%E9%A1%B5%E5%AD%97%E4%BD%93%E5%8A%A8%E6%80%81%E8%A3%81%E5%89%AA/

def cut(f):
    os.system(f'pyftsubset {f} --flavor=woff2 --with-zopfli --text-file=./zh-cn-characters.txt')

for root, dirs, files in os.walk('.'):
    for f in files:
        if f.split('.')[-1].lower() == 'ttf' and f.split('.')[-1].lower() != 'subset':
            cut(f)

# os.system(f'fonttools ttLib.woff2 compress -o font.woff2 font.ttf')
