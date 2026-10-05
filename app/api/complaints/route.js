import { NextResponse } from 'next/server';
import { getGeo } from '../../../lib/geo';
import { readAll, add } from '../../../lib/store';

export const dynamic = 'force-dynamic';

const day = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
const fail = (error) => NextResponse.json({ error }, { status: 400 });
const clean = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v) => (v === '' || v == null ? NaN : Number(v));

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const all = await readAll();
  const today = day(new Date());
  const bills = all.filter((c) => c.type === 'bill');
  const stats = {
    total: all.length,
    today: all.filter((c) => day(c.at) === today).length,
    bills: bills.length,
    extra: bills.reduce((s, c) => s + c.extra, 0),
  };
  let items = all;
  if (p.get('type')) items = items.filter((c) => c.type === p.get('type'));
  if (p.get('district')) items = items.filter((c) => c.district === p.get('district'));
  return NextResponse.json({ stats, items: items.slice(0, 100) });
}

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return fail('generic'); }
  if (!['loadshedding', 'bill'].includes(b.type)) return fail('generic');

  let u, division, district;
  try {
    const geo = await getGeo();
    const v = geo.find((x) => x.bn === clean(b.division, 40));
    const d = v?.districts.find((x) => x.bn === clean(b.district, 40));
    u = d?.upazilas.find((x) => x.bn === clean(b.upazila, 60));
    division = v?.bn; district = d?.bn;
  } catch { return NextResponse.json({ error: 'geo' }, { status: 503 }); }
  if (!u) return fail('area');
  const union = clean(b.union, 60);
  if (union && !u.unions.includes(union)) return fail('area');
  const text = clean(b.text, 500);
  if (text.length < 10) return fail('text');
  if (/[0-9\u09E6-\u09EF]{8,}/.test(text)) return fail('pii'); // phone / meter numbers

  // No name, IP or user id is stored: complaints are anonymous by design.
  const item = { id: crypto.randomUUID(), type: b.type, division, district, upazila: u.bn, union, village: clean(b.village, 60), text, at: new Date().toISOString() };
  if (b.type === 'loadshedding') {
    const h = num(b.hours);
    if (!(h >= 0 && h <= 24)) return fail('hours');
    item.hours = h;
  } else {
    const billed = num(b.billed), extra = num(b.extra);
    if (!(billed > 0 && billed <= 1e7) || !(extra >= 0 && extra <= billed)) return fail('amount');
    item.billed = billed; item.extra = extra;
  }
  await add(item);
  return NextResponse.json({ ok: true }, { status: 201 });
}
