/**
 * Minimal PNG decoder — 8-bit, truecolor (RGB/RGBA), interlace'siz.
 * Playwright ekran görüntüleri bu formatta gelir. `sharp` gibi native bir
 * bağımlılığa gerek kalmadan piksel karşılaştırması (panorama sürekliliği testi)
 * yapmak için yeterli.
 */
import zlib from "node:zlib";

export type DecodedPng = {
  width: number;
  height: number;
  channels: 3 | 4;
  /** height*width*channels uzunluğunda, filtresi çözülmüş RGBA/RGB verisi. */
  data: Buffer;
};

export function decodePng(buf: Buffer): DecodedPng {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG imzası geçersiz");
  let pos = 8;
  let width = 0,
    height = 0,
    bitDepth = 0,
    colorType = 0;
  const idat: Buffer[] = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const dataStart = pos + 8;
    if (type === "IHDR") {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
      bitDepth = buf[dataStart + 8];
      colorType = buf[dataStart + 9];
      const interlace = buf[dataStart + 12];
      if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Desteklenmeyen PNG (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace})`);
      }
    } else if (type === "IDAT") {
      idat.push(buf.subarray(dataStart, dataStart + len));
    } else if (type === "IEND") {
      break;
    }
    pos = dataStart + len + 4; // +4 CRC atla
  }

  const channels: 3 | 4 = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  const prev = Buffer.alloc(stride);
  let rp = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const cur = out.subarray(y * stride, y * stride + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let val = raw[rp + x];
      switch (filter) {
        case 0:
          break;
        case 1:
          val = (val + a) & 255;
          break;
        case 2:
          val = (val + b) & 255;
          break;
        case 3:
          val = (val + ((a + b) >> 1)) & 255;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          val = (val + pr) & 255;
          break;
        }
        default:
          throw new Error(`Bilinmeyen PNG filter: ${filter}`);
      }
      cur[x] = val;
    }
    rp += stride;
    cur.copy(prev);
  }

  return { width, height, channels, data: out };
}

/** Bir görüntünün belirli x sütununu (tüm satırlar) RGBA olarak döndürür. */
export function columnPixels(img: DecodedPng, x: number): Buffer {
  const col = Buffer.alloc(img.height * img.channels);
  const stride = img.width * img.channels;
  for (let y = 0; y < img.height; y++) {
    img.data.copy(col, y * img.channels, y * stride + x * img.channels, y * stride + (x + 1) * img.channels);
  }
  return col;
}
