// Server-only: loads Bangladesh division > district > upazila > union data from the
// public JSON and keeps a compact copy in memory (the file is too big for Next's fetch cache).
const SRC = 'https://iqbalhasandev.github.io/bangladesh-geo-json/bangladesh-geo.json';
const t = (s) => String(s || '').replace(/\s+/g, ' ').trim();
let cache = null;

export async function getGeo() {
  if (cache) return cache;
  const res = await fetch(SRC, { cache: 'no-store' });
  if (!res.ok) throw new Error('geo source unavailable');
  const raw = await res.json();
  cache = raw.map((v) => ({
    bn: t(v.bn_name), en: t(v.name),
    districts: v.districts.map((d) => ({
      bn: t(d.bn_name), en: t(d.name),
      upazilas: d.upazilas.map((u) => ({
        bn: t(u.bn_name), en: t(u.name),
        unions: [...new Set(u.unions.map((n) => t(n.bn_name)))],
      })),
    })),
  }));
  return cache;
}
