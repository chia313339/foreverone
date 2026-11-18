"""v2 切圖腳本：從設計稿整頁 JPG 產生網站用 webp（2026-11-18）
用法：
  python3 build_v2_assets.py "<設計稿.jpg>" "<公設實績圖資料夾>" <輸出資料夾>
需 Pillow、numpy、scipy。座標以設計稿 4000px 寬為準，若設計稿改版需重新量測。
"""
import sys, os
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
SRC=sys.argv[1]; PH=sys.argv[2]; OUT=sys.argv[3]
im=Image.open(SRC).convert('RGB'); A=np.asarray(im).astype(np.float32)

def inpaint(arr, box, ls, rs):
    x0,y0,x1,y1=box
    for y in range(y0,y1):
        L=np.median(arr[y,ls[0]:ls[1]],axis=0); R=np.median(arr[y,rs[0]:rs[1]],axis=0)
        t=np.linspace(0,1,x1-x0)[:,None]
        arr[y,x0:x1]=L*(1-t)+R*t
def save(arr, name, box, w=2400, q=82):
    x0,y0,x1,y1=box
    img=Image.fromarray(np.clip(arr[y0:y1,x0:x1],0,255).astype(np.uint8))
    if img.width>w: img=img.resize((w,round(img.height*w/img.width)),Image.LANCZOS)
    img.save(f"{OUT}/{name}.webp",quality=q,method=6); print(name,img.size)
    return img
def textlayer(orig, bg, box, color, name, w=None, circle=None):
    x0,y0,x1,y1=box
    o=orig[y0:y1,x0:x1].mean(2); b=bg[y0:y1,x0:x1].mean(2)
    a=np.clip((o-b)/np.maximum(1,(255-b)),0,1)
    if circle:
        cx,cy,r=circle; yy,xx=np.mgrid[y0:y1,x0:x1]; a[(xx-cx)**2+(yy-cy)**2>r*r]=0
    a[a<0.06]=0
    if circle:
        from scipy import ndimage
        lab,n=ndimage.label(a>0.15)
        for k in range(1,n+1):
            m=lab==k; ys_,xs_=np.nonzero(m)
            if m.sum()<400 and (ys_.max()-ys_.min())>3 and m.sum()/((ys_.ptp()+1)*(xs_.ptp()+1))<0.35: a[ndimage.binary_dilation(m,iterations=2)]=0
    ys,xs=np.nonzero(a>0.1); print(name,ys.min(),ys.max(),xs.min(),xs.max()); a=a[max(0,ys.min()-4):ys.max()+5, max(0,xs.min()-4):xs.max()+5]
    rgba=np.zeros(a.shape+(4,),np.uint8); rgba[...,:3]=color; rgba[...,3]=(a*255).astype(np.uint8)
    img=Image.fromarray(rgba,'RGBA')
    if w and img.width>w: img=img.resize((w,round(img.height*w/img.width)),Image.LANCZOS)
    img.save(f"{OUT}/{name}.webp",lossless=True); print(name,img.size)

# hero
save(A,'hero',(0,300,4000,2480))
# traffic
T=A.copy(); inpaint(T,(320,3190,1680,3680),(150,310),(1700,1950))
save(T,'traffic',(0,3150,4000,5400))
# energy
E=A.copy(); orig=A.copy()
inpaint(E,(380,6120,1975,6640),(240,375),(1985,2160))
inpaint(E,(2170,6070,3570,6670),(1985,2160),(3580,3800))
save(E,'energy',(0,6100,4000,8330))
for i,cx in enumerate([640,1177,1710]):
    textlayer(orig,E,(cx-190,6255,cx+165,6440),(255,255,255),f'stat{i+1}',w=340,circle=(cx,6381,200))
# closing banner
save(A,'banner',(0,16150,4000,17830))
# map bg (desktop) + footer strip
save(A,'footer_bg',(0,19700,4000,22132))
save(A,'footer_strip',(0,21560,4000,22132),w=2000)
# calligraphy chars (navy bg, lossless)
for name,yc in [('char_yun',2760),('char_neng',5785),('char_shi',8630),('char_qi',13100)]:
    img=Image.fromarray(A[yc-70:yc+70,1910:2090].astype(np.uint8)).resize((90,70),Image.LANCZOS)
    img.save(f"{OUT}/{name}.webp",lossless=True)
# header logo: navy on light bg
x0,y0,x1,y1=160,70,660,220
reg=A[y0:y1,x0:x1]; L=reg.mean(2); bgL=np.median(np.r_[L[:6].ravel(),L[-6:].ravel()])
dark=np.unravel_index(L.argmin(),L.shape); fg=reg[dark]; fgL=L[dark]
a=np.clip((bgL-L)/(bgL-fgL),0,1); a[a<0.06]=0
ys,xs=np.nonzero(a>0.1); a=a[ys.min()-3:ys.max()+4, xs.min()-3:xs.max()+4]
rgba=np.zeros(a.shape+(4,),np.uint8); rgba[...,:3]=fg.astype(np.uint8); rgba[...,3]=(a*255).astype(np.uint8)
Image.fromarray(rgba,'RGBA').save(f"{OUT}/logo_header.webp",lossless=True); print('logo',a.shape,'#%02x%02x%02x'%tuple(fg.astype(int)))
# amenity photos
for i,f in enumerate(['_DSC5000s.jpg','_DSC5007s.jpg','_DSC5048s.jpg']):
    p=Image.open(os.path.join(PH,f)).convert('RGB'); p=p.resize((1200,round(p.height*1200/p.width)),Image.LANCZOS)
    p.save(f"{OUT}/amenity{i+1}.webp",quality=80,method=6); print(f,p.size)
# og image 1200x630 from hero
h=Image.fromarray(A[300:2480].astype(np.uint8)); h=h.resize((1200,round(2180*1200/4000)),Image.LANCZOS)
top=(h.height-630)//2 if h.height>630 else 0
h.crop((0,top,1200,top+630)).save(f"{OUT}/meta.jpg",quality=85); print('meta',h.size)
# gold sample
reg=A[3110:3160,320:900]; L=reg.mean(2); print('gold','#%02x%02x%02x'%tuple(reg[np.unravel_index(L.argmax(),L.shape)].astype(int)))
