import { NextResponse } from 'next/server';
import { AREAS } from '../../../data/content';

const CONTACT = {
  sms: /^(\+?88)?01[3-9]\d{8}$/,
  telegram: /^@?[A-Za-z0-9_]{5,32}$/,
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
};

const fail = (error) => NextResponse.json({ error }, { status: 400 });

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return fail('generic'); }

  if (!AREAS.some((a) => a.id === b.areaId)) return fail('area');
  if (!CONTACT[b.channel]?.test(String(b.contact || '').trim())) return fail('contact');
  if (b.consent !== true) return fail('consent');
  if (![15, 30, 60].includes(Number(b.lead))) return fail('generic');

  // TODO: save to a database (Supabase/Firebase), verify the contact with an OTP,
  // then let a cron job send alerts. Nothing is stored in this starter.
  return NextResponse.json({ ok: true });
}
