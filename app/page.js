'use client';
import { useCallback, useEffect, useState } from 'react';
import { T } from '../lib/i18n';

const EMPTY = { type: 'loadshedding', division: '', district: '', upazila: '', union: '', village: '', text: '', hours: '', billed: '', extra: '' };
const Bolt = () => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" /></svg>;

export default function Home() {
  const [lang, setLang] = useState('bn');
  const [tab, setTab] = useState('');
  const [dist, setDist] = useState('');
  const [geo, setGeo] = useState([]);
  const [data, setData] = useState({ items: [], stats: null });
  const [now, setNow] = useState(Date.now());
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null);

  const t = T[lang];
  const nf = (n) => Number(n).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');
  const taka = (n) => '৳' + nf(n);
  const nm = (o) => (lang === 'bn' ? o.bn : o.en);
  const rtf = new Intl.RelativeTimeFormat(lang === 'bn' ? 'bn' : 'en', { numeric: 'auto' });
  const ago = (iso) => {
    const s = (Date.parse(iso) - now) / 1000;
    if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    return rtf.format(Math.round(s / 86400), 'day');
  };

  const load = useCallback(async () => {
    const q = new URLSearchParams({ ...(tab && { type: tab }), ...(dist && { district: dist }) });
    try { setData(await (await fetch('/api/complaints?' + q, { cache: 'no-store' })).json()); } catch {}
    setNow(Date.now());
  }, [tab, dist]);

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);
  useEffect(() => {
    fetch('/api/geo').then((r) => r.json()).then((g) => Array.isArray(g) && setGeo(g)).catch(() => {});
    try { const l = localStorage.getItem('lang'); if (l === 'bn' || l === 'en') setLang(l); } catch {}
  }, []);

  const pickLang = (l) => { setLang(l); try { localStorage.setItem('lang', l); } catch {} };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cascade = (k, reset) => (e) => setForm({ ...form, [k]: e.target.value, ...Object.fromEntries(reset.map((r) => [r, ''])) });

  const div = geo.find((x) => x.bn === form.division);
  const dis = div?.districts.find((x) => x.bn === form.district);
  const upz = dis?.upazilas.find((x) => x.bn === form.upazila);

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: 'load' });
    try {
      const r = await fetch('/api/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) return setStatus({ type: 'err', key: d.error });
      setForm({ ...EMPTY, type: form.type, division: form.division, district: form.district, upazila: form.upazila, union: form.union });
      setStatus({ type: 'ok' });
      load();
    } catch { setStatus({ type: 'err', key: 'generic' }); }
  }

  const s = data.stats;
  const place = (c) => [c.village, c.union, c.upazila, c.district, c.division].filter(Boolean).join(', ');
  const Select = ({ label, value, onChange, ph, children, disabled }) => (
    <label className="field"><span>{label}</span>
      <select value={value} onChange={onChange} disabled={disabled}><option value="">{ph}</option>{children}</select>
    </label>
  );

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand"><span className="logo"></span><b></b></div>
        <div className="seg" role="group" aria-label="Language">
          <button aria-pressed={lang === 'bn'} onClick={() => pickLang('bn')}>বাংলা</button>
          <button aria-pressed={lang === 'en'} onClick={() => pickLang('en')}>EN</button>
        </div>
      </header>

      <section className="hero">
        <h1>{t.tag}</h1>
        <p>{t.sub}</p>
        <a className="cta" href="#form">{t.cta}</a>
      </section>

      <section className="stats" aria-live="polite">
        {[['today', s?.today, nf], ['total', s?.total, nf], ['bills', s?.bills, nf], ['extra', s?.extra, taka]].map(([k, v, f]) => (
          <div key={k} className={k === 'extra' ? 'stat hot' : 'stat'}>
            <strong>{s ? f(v) : '--'}</strong><span>{t[k]}</span>
          </div>
        ))}
      </section>

      <div className="cols">
        <section>
          <div className="filters">
            <div className="seg">
              {[['', 'all'], ['loadshedding', 'ls'], ['bill', 'bill']].map(([v, k]) => (
                <button key={k} aria-pressed={tab === v} onClick={() => setTab(v)}>{t[k]}</button>
              ))}
            </div>
            <select value={dist} onChange={(e) => setDist(e.target.value)} aria-label={t.district}>
              <option value="">{t.allDist}</option>
              {geo.map((v) => <optgroup key={v.bn} label={nm(v)}>{v.districts.map((d) => <option key={d.bn} value={d.bn}>{nm(d)}</option>)}</optgroup>)}
            </select>
          </div>

          {data.items.length === 0 && <p className="empty">{t.empty}</p>}
          <ol className="feed">
            {data.items.map((c) => (
              <li key={c.id} className={`item ${c.type}`}>
                <div className="meta">
                  <span className="chip">{c.type === 'bill' ? t.bill : t.ls}</span>
                  <span>{t.anon} · <time dateTime={c.at}>{ago(c.at)}</time></span>
                </div>
                <p className="where">📍 {place(c)}</p>
                {c.type === 'bill'
                  ? <p className="what">{t.billOf(taka(c.billed))} <em>{t.extraOf(taka(c.extra))}</em></p>
                  : <p className="what">{t.hoursOff(nf(c.hours))}</p>}
                <p className="body">{c.text}</p>
              </li>
            ))}
          </ol>
          <p className="note">{t.note}</p>
        </section>

        <aside className="card" id="form">
          <h2>{t.form}</h2>
          <form onSubmit={submit} noValidate>
            <div className="seg">
              {[['loadshedding', 'ls'], ['bill', 'bill']].map(([v, k]) => (
                <button type="button" key={v} aria-pressed={form.type === v} onClick={() => setForm({ ...form, type: v })}>{t[k]}</button>
              ))}
            </div>
            <Select label={t.division} value={form.division} onChange={cascade('division', ['district', 'upazila', 'union'])} ph={geo.length ? t.pickDiv : t.loading}>
              {geo.map((v) => <option key={v.bn} value={v.bn}>{nm(v)}</option>)}
            </Select>
            <Select label={t.district} value={form.district} onChange={cascade('district', ['upazila', 'union'])} ph={t.pickDist} disabled={!div}>
              {div?.districts.map((d) => <option key={d.bn} value={d.bn}>{nm(d)}</option>)}
            </Select>
            <Select label={t.upazila} value={form.upazila} onChange={cascade('upazila', ['union'])} ph={t.pickUpz} disabled={!dis}>
              {dis?.upazilas.map((u) => <option key={u.bn} value={u.bn}>{nm(u)}</option>)}
            </Select>
            <Select label={t.union} value={form.union} onChange={set('union')} ph={t.pickUnion} disabled={!upz}>
              {upz?.unions.map((u) => <option key={u}>{u}</option>)}
            </Select>
            <label className="field"><span>{t.village}</span><input className="input" value={form.village} onChange={set('village')} maxLength={60} /></label>
            {form.type === 'loadshedding' ? (
              <label className="field"><span>{t.hours}</span><input className="input" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={set('hours')} /></label>
            ) : (
              <>
                <label className="field"><span>{t.billed}</span><input className="input" type="number" min="1" value={form.billed} onChange={set('billed')} /></label>
                <label className="field"><span>{t.extraIn}</span><input className="input" type="number" min="0" value={form.extra} onChange={set('extra')} /></label>
              </>
            )}
            <label className="field"><span>{t.text}</span><textarea className="input" rows={4} maxLength={500} value={form.text} onChange={set('text')} /></label>
            <p className="note">🔒 {t.privacy}</p>
            <button className="go" disabled={status?.type === 'load'}>{status?.type === 'load' ? t.sending : t.btn}</button>
            {status?.type === 'ok' && <p className="msg ok" role="status">{t.done}</p>}
            {status?.type === 'err' && <p className="msg bad" role="alert">{t.err[status.key] || t.err.generic}</p>}
          </form>
        </aside>
      </div>
    </main>
  );
}
