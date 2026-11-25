// 從 AI（PDF 相容）檔以指定寬度輸出某段列的 PNG。用法：swiftc -O render_ai.swift -o render_ai && ./render_ai <檔.ai> 4000 <out.png> <y0> <y1>
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1]) as CFURL
let outW = Double(args[2])!
guard let doc = CGPDFDocument(url), let page = doc.page(at: 1) else { print("fail"); exit(1) }
let box = page.getBoxRect(.mediaBox)
print("pages", doc.numberOfPages, "box", box)
if args.count < 4 { exit(0) }
let sc = outW / Double(box.width)
// crop rows y0..y1 in output pixel space (top-down)
let y0 = Double(args[4])!, y1 = Double(args[5])!
let W = Int(outW), H = Int(y1 - y0)
let cs = CGColorSpaceCreateDeviceRGB()
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red:1,green:1,blue:1,alpha:1)); ctx.fill(CGRect(x:0,y:0,width:W,height:H))
// PDF coords bottom-up: map so that output row y0 is top
let totalH = Double(box.height) * sc
ctx.translateBy(x: 0, y: -(totalH - y1))
ctx.scaleBy(x: sc, y: sc)
ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
ctx.drawPDFPage(page)
let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[3]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil); CGImageDestinationFinalize(dest)
print("ok", W, H)
