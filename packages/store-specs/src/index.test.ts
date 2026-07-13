/** Minimal test — harici test runner'a bağımlılık yok, tsx ile çalışır. */
import assert from "node:assert/strict";
import { STORE_TARGETS, getTarget, targetsFor, logicalViewport, validateTargets } from "./index.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("store-specs testleri:");

test("registry tutarlı (validateTargets boş)", () => {
  const problems = validateTargets();
  assert.deepEqual(problems, [], `Registry sorunları: ${problems.join("; ")}`);
});

test("getTarget bilinen id'yi döndürür", () => {
  assert.equal(getTarget("ios-6.9").width, 1290);
});

test("getTarget bilinmeyen id'de hata fırlatır", () => {
  assert.throws(() => getTarget("yok-boyle-bir-sey"));
});

test("targetsFor mağazaya göre filtreler", () => {
  assert.ok(targetsFor("app-store").every((t) => t.store === "app-store"));
  assert.ok(targetsFor("play-store").length > 0);
});

test("logicalViewport tam sayı üretir", () => {
  for (const t of STORE_TARGETS) {
    const v = logicalViewport(t);
    assert.ok(Number.isInteger(v.width) && Number.isInteger(v.height), `${t.id} kesirli viewport`);
  }
});

test("en az bir zorunlu iOS ve Android hedefi var", () => {
  assert.ok(targetsFor("app-store").some((t) => t.required));
  assert.ok(targetsFor("play-store").some((t) => t.required));
});

console.log(`\n${passed} test geçti ✅`);
