import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal standard PNG creator in pure Node.js
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: row filter byte (0) + row pixels
  const rowSize = width * 4;
  const scanlines = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (rowSize + 1)] = 0; // filter type None
    rgbaBuffer.copy(scanlines, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  // IDAT
  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Helpers for drawing onto RGBA buffer
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0); // Transparent by default
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.buffer[idx] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = a;
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let cy = y; cy < y + h; cy++) {
      for (let cx = x; cx < x + w; cx++) {
        this.setPixel(cx, cy, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= radius) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  fillGradientEllipse(cx, cy, rx, ry) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (d <= 1.0) {
          const alpha = Math.round(140 * (1 - d));
          this.setPixel(x, y, 0, 0, 0, alpha);
        }
      }
    }
  }

  savePng(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const png = createPng(this.width, this.height, this.buffer);
    fs.writeFileSync(filePath, png);
    console.log(`Saved: ${filePath} (${this.width}x${this.height})`);
  }
}

const baseDir = path.resolve('public/assets');

// 1. grass.png
const grass = new PixelCanvas(64, 64);
grass.fillRect(0, 0, 64, 64, 45, 106, 79); // #2d6a4f
for (let i = 0; i < 90; i++) {
  const x = (i * 17) % 62 + 1;
  const y = (i * 29) % 62 + 1;
  const tones = [
    [27, 67, 50],
    [52, 122, 86],
    [64, 145, 108],
    [82, 183, 136]
  ];
  const t = tones[i % tones.length];
  grass.fillRect(x, y, 2, 3, t[0], t[1], t[2]);
}
grass.fillRect(14, 22, 3, 3, 255, 183, 3); // Dandelion
grass.fillRect(48, 40, 3, 3, 255, 183, 3);
grass.fillRect(38, 12, 3, 3, 254, 250, 224); // Chamomile
grass.fillRect(20, 50, 3, 3, 254, 250, 224);
grass.savePng(path.join(baseDir, 'terrain/grass.png'));

// 2. water.png
const water = new PixelCanvas(64, 64);
water.fillRect(0, 0, 64, 64, 29, 78, 137); // #1d4e89
for (let y = 6; y < 64; y += 12) {
  water.fillRect(0, y, 64, 4, 0, 119, 182); // #0077b6
}
water.fillRect(8, 7, 18, 2, 144, 224, 239);
water.fillRect(38, 19, 20, 2, 144, 224, 239);
water.fillRect(4, 31, 14, 2, 144, 224, 239);
water.fillRect(32, 43, 22, 2, 144, 224, 239);
water.fillRect(16, 55, 16, 2, 144, 224, 239);
water.savePng(path.join(baseDir, 'terrain/water.png'));

// 3. dirt.png
const dirt = new PixelCanvas(64, 64);
dirt.fillRect(0, 0, 64, 64, 140, 98, 57); // #8c6239
const dirtTones = [
  [107, 75, 43],
  [124, 84, 50],
  [157, 113, 69],
  [168, 126, 83]
];
for (let i = 0; i < 120; i++) {
  const x = (i * 23) % 62 + 1;
  const y = (i * 37) % 62 + 1;
  const t = dirtTones[i % dirtTones.length];
  dirt.fillRect(x, y, 2, 2, t[0], t[1], t[2]);
}
dirt.fillRect(18, 16, 3, 2, 191, 161, 130);
dirt.fillRect(42, 34, 3, 2, 191, 161, 130);
dirt.fillRect(26, 48, 3, 2, 191, 161, 130);
dirt.savePng(path.join(baseDir, 'terrain/dirt.png'));

// 4. bridge.png
const bridge = new PixelCanvas(64, 64);
bridge.fillRect(0, 0, 64, 64, 69, 26, 3); // gap #451a03
for (let y = 0; y < 64; y += 8) {
  const c = y % 16 === 0 ? [146, 64, 14] : [120, 53, 15];
  bridge.fillRect(0, y + 1, 64, 6, c[0], c[1], c[2]);
  bridge.fillRect(3, y + 3, 2, 2, 203, 213, 225); // iron nail
  bridge.fillRect(59, y + 3, 2, 2, 203, 213, 225);
}
bridge.savePng(path.join(baseDir, 'terrain/bridge.png'));

// 5. pine_tree.png (transparent background)
const pine = new PixelCanvas(64, 128);
pine.fillRect(28, 90, 8, 36, 69, 26, 3); // trunk
pine.fillRect(30, 90, 4, 36, 120, 53, 15);
const tiers = [
  { y: 70, w: 48, h: 32 },
  { y: 44, w: 40, h: 30 },
  { y: 20, w: 28, h: 28 },
  { y: 6,  w: 16, h: 20 }
];
tiers.forEach(t => {
  for (let row = 0; row < t.h; row++) {
    const halfWidth = Math.round((row / t.h) * (t.w / 2));
    const py = t.y + row;
    pine.fillRect(32 - halfWidth, py, halfWidth * 2, 1, 27, 67, 50); // dark pine
    if (halfWidth > 3) {
      pine.fillRect(32 - halfWidth + 2, py, (halfWidth - 2) * 2, 1, 45, 106, 79); // vibrant green
    }
    if (halfWidth > 6) {
      pine.fillRect(32 - Math.round(halfWidth * 0.4), py, Math.round(halfWidth * 0.8), 1, 82, 183, 136); // sunlight tip
    }
  }
});
pine.savePng(path.join(baseDir, 'props/pine_tree.png'));

// 6. rock.png (transparent background)
const rock = new PixelCanvas(64, 64);
rock.fillCircle(32, 38, 20, 30, 41, 59); // base outline #1e293b
rock.fillCircle(32, 38, 18, 71, 85, 105); // granite body #475569
rock.fillCircle(38, 32, 12, 148, 163, 184); // sunlit facet #94a3b8
rock.fillCircle(24, 42, 10, 51, 65, 85); // shadow facet #334155
rock.savePng(path.join(baseDir, 'props/rock.png'));

// 7. shack.png (transparent background)
const shack = new PixelCanvas(128, 128);
shack.fillRect(86, 12, 14, 28, 71, 85, 105); // chimney
shack.fillRect(20, 50, 88, 72, 120, 53, 15); // log walls #78350f
for (let y = 50; y < 120; y += 10) {
  shack.fillRect(20, y, 88, 2, 69, 26, 3);
  shack.fillRect(20, y + 2, 88, 8, 146, 64, 14);
}
// Pitched roof
for (let row = 0; row < 44; row++) {
  const halfW = Math.round((row / 44) * 54);
  shack.fillRect(64 - halfW, 10 + row, halfW * 2, 1, 180, 83, 9); // #b45309
}
shack.fillRect(54, 78, 20, 44, 85, 34, 4); // door
shack.fillRect(28, 70, 16, 20, 254, 240, 138); // glowing window #fef08a
shack.fillRect(82, 70, 16, 20, 254, 240, 138); // glowing window #fef08a
shack.savePng(path.join(baseDir, 'props/shack.png'));

// 8. shadow.png (transparent soft radial gradient)
const shadow = new PixelCanvas(64, 64);
shadow.fillGradientEllipse(32, 32, 28, 18);
shadow.savePng(path.join(baseDir, 'props/shadow.png'));

// 9. Character Sprites: settler.png, merchant.png, ranger.png, farmer.png
function makeCharacter(filename, tunicRgb, hatRgb) {
  const char = new PixelCanvas(64, 96);
  // Hat
  char.fillRect(22, 14, 20, 8, hatRgb[0], hatRgb[1], hatRgb[2]);
  char.fillRect(26, 8, 12, 7, hatRgb[0], hatRgb[1], hatRgb[2]);
  // Face
  char.fillRect(24, 22, 16, 16, 252, 211, 77); // skin
  char.fillRect(28, 28, 2, 3, 30, 41, 59); // eyes
  char.fillRect(34, 28, 2, 3, 30, 41, 59);
  // Tunic
  char.fillRect(20, 38, 24, 28, tunicRgb[0], tunicRgb[1], tunicRgb[2]);
  char.fillRect(16, 40, 4, 18, tunicRgb[0], tunicRgb[1], tunicRgb[2]);
  char.fillRect(44, 40, 4, 18, tunicRgb[0], tunicRgb[1], tunicRgb[2]);
  char.fillRect(16, 58, 4, 4, 252, 211, 77);
  char.fillRect(44, 58, 4, 4, 252, 211, 77);
  // Belt
  char.fillRect(20, 52, 24, 5, 41, 24, 7);
  char.fillRect(30, 52, 4, 5, 245, 158, 11);
  // Pants & Boots
  char.fillRect(23, 66, 8, 16, 51, 65, 85);
  char.fillRect(33, 66, 8, 16, 51, 65, 85);
  char.fillRect(22, 82, 9, 8, 30, 27, 24);
  char.fillRect(33, 82, 9, 8, 30, 27, 24);
  char.savePng(path.join(baseDir, `agents/${filename}`));
}

makeCharacter('settler.png', [197, 61, 61], [62, 39, 35]); // Crimson tunic
makeCharacter('merchant.png', [198, 166, 100], [120, 53, 15]); // Gold tunic
makeCharacter('ranger.png', [78, 154, 98], [27, 67, 50]); // Green tunic
makeCharacter('farmer.png', [217, 119, 6], [133, 77, 14]); // Amber tunic
