/** png.ts birim testleri — tarayıcı gerektirmez, tsx ile çalışır. */
import assert from "node:assert/strict";
import { encodePng, decodePng, flattenPngToRgb, columnPixels } from "./png.ts";
import { readPngSize } from "./render.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("png testleri:");

test("RGB encode → decode roundtrip (piksel birebir)", () => {
  const w = 5,
    h = 4;
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0; i < rgb.length; i++) rgb[i] = (i * 37) % 256;
  const png = encodePng(w, h, rgb, 3);
  assert.deepEqual(readPngSize(png), { width: w, height: h });
  assert.equal(png[25], 2, "colorType RGB olmalı");
  const dec = decodePng(png);
  assert.equal(dec.channels, 3);
  assert.ok(dec.data.equals(rgb));
});

test("RGBA encode → decode roundtrip", () => {
  const w = 3,
    h = 3;
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 53) % 256;
  const png = encodePng(w, h, rgba, 4);
  assert.equal(png[25], 6, "colorType RGBA olmalı");
  const dec = decodePng(png);
  assert.equal(dec.channels, 4);
  assert.ok(dec.data.equals(rgba));
});

test("flatten: opak RGBA → RGB, renkler birebir korunur", () => {
  const w = 2,
    h = 2;
  const rgba = Buffer.from([
    255, 0, 0, 255,   0, 255, 0, 255,
    0, 0, 255, 255,   10, 20, 30, 255,
  ]);
  const flat = flattenPngToRgb(encodePng(w, h, rgba, 4));
  assert.equal(flat[25], 2, "çıktı alfasız olmalı");
  const dec = decodePng(flat);
  assert.deepEqual([...dec.data], [255, 0, 0, 0, 255, 0, 0, 0, 255, 10, 20, 30]);
});

test("flatten: yarı saydam piksel beyaz zemine bindirilir", () => {
  // Siyah, alfa 128 → beyaz üstünde ≈ 127-128 gri.
  const png = encodePng(1, 1, Buffer.from([0, 0, 0, 128]), 4);
  const dec = decodePng(flattenPngToRgb(png));
  for (const v of dec.data) assert.ok(Math.abs(v - 127) <= 1, `gri ~127 bekleniyor, ${v} geldi`);
});

test("flatten: zaten RGB olan PNG'ye dokunmaz", () => {
  const png = encodePng(2, 1, Buffer.from([1, 2, 3, 4, 5, 6]), 3);
  assert.equal(flattenPngToRgb(png), png);
});

test("columnPixels doğru sütunu döndürür", () => {
  const w = 3,
    h = 2;
  // Satır0: A B C, Satır1: D E F (tek kanallı gibi 3 kanal tekrar)
  const rgb = Buffer.from([
    10, 10, 10, 20, 20, 20, 30, 30, 30,
    40, 40, 40, 50, 50, 50, 60, 60, 60,
  ]);
  const img = decodePng(encodePng(w, h, rgb, 3));
  assert.deepEqual([...columnPixels(img, 1)], [20, 20, 20, 50, 50, 50]);
});

console.log(`\n${passed} test geçti ✅`);
