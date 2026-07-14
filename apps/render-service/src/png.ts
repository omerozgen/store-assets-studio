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

// ---- Minimal PNG encoder (8-bit truecolor RGB, filter 0) ----

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([head, typed, crc]);
}

/** RGB (3 kanal) piksel verisini 24-bit, alfasız PNG'ye kodlar. */
export function encodePngRgb(width: number, height: number, rgb: Buffer): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height); // her satır başında filter byte (0)
  for (let y = 0; y < height; y++) {
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor (RGB, alfasız)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Mağaza uyumu: RGBA PNG'yi 24-bit RGB'ye düzleştirir (Apple/Google alfa istemez).
 * Yarı saydam pikseller beyaz zemine bindirilir; zaten RGB ise dokunmaz.
 */
export function flattenPngToRgb(png: Buffer): Buffer {
  const img = decodePng(png);
  if (img.channels === 3) return png;
  const { width, height, data } = img;
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
    const a = data[i + 3];
    if (a === 255) {
      rgb[o] = data[i];
      rgb[o + 1] = data[i + 1];
      rgb[o + 2] = data[i + 2];
    } else {
      // Beyaz zemine alfa-birleştirme
      rgb[o] = (data[i] * a + 255 * (255 - a) + 127) / 255;
      rgb[o + 1] = (data[i + 1] * a + 255 * (255 - a) + 127) / 255;
      rgb[o + 2] = (data[i + 2] * a + 255 * (255 - a) + 127) / 255;
    }
  }
  return encodePngRgb(width, height, rgb);
}
