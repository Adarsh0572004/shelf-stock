import React, { useEffect, useState } from 'react';

const endpoint = '/api/items';
async function request(url, method = 'GET', data) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}

export default function App() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() { setRows(await request(endpoint)); }
  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);
  async function submit(action, form) {
    setBusy(true);
    setError('');
    try { if (action) await action(); form?.reset(); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function add(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.threshold = Number(data.threshold);
    data.sku = data.sku.trim().toUpperCase();
    submit(() => request(endpoint, 'POST', data), form);
  }
  const shown = (rows || []).filter(row => [row._id, row.name].join(' ').toLowerCase().includes(filter.toLowerCase()));
  return <main><header><h1>Shelf Stock</h1><p>Track quantities, reorder levels and recent stock movements.</p></header>
    <section><h2>Register product</h2><form onSubmit={add}><fieldset disabled={busy}>
    <label>SKU<input name="sku" pattern="[A-Za-z0-9_-]{1,32}" required /></label>
    <label>Product name<input name="name" maxLength="100" required /></label>
    <label>Reorder level<input name="threshold" type="number" min="0" max="1000000" defaultValue="5" required /></label>
    <button>Add product</button></fieldset></form></section>
    <section><h2>Inventory</h2><div className="toolbar"><label>Search<input type="search" value={filter} onChange={e => setFilter(e.target.value)} /></label>
    <button disabled={busy} onClick={() => submit()}>Refresh</button></div>
    {error && <p role="alert">{error}</p>}
    {rows === null ? <p>{error ? 'Records unavailable.' : 'Loading…'}</p> : shown.length === 0 ? <p>No matching records.</p> : shown.map(row => <article key={row._id}>
    <h3>{row.name} <small>{row._id}</small></h3><p>{row.units} units · Reorder at {row.threshold}{row.units <= row.threshold && ' · Low stock'}</p>
    <form onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const data = Object.fromEntries(new FormData(form)); submit(() => request(endpoint + '/' + row._id + '/movements', 'POST', { ...data, quantity: Number(data.quantity) }), form); }}>
      <fieldset disabled={busy}><label>Movement<select name="direction"><option value="receive">Receive</option><option value="issue">Issue</option></select></label>
      <label>Quantity<input type="number" name="quantity" min="1" max="1000000" required /></label><button>Record movement</button></fieldset></form>
    <details><summary>Recent history ({row.history.length})</summary><ul>{row.history.slice().reverse().map((h,i) => <li key={i}>{(h.delta > 0 ? '+' : '') + h.delta + ' units'} · {new Date(h.at).toLocaleString()}</li>)}</ul></details>
    </article>)}</section></main>;
}
