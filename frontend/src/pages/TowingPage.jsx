import { useMemo, useState } from 'react';

export default function TowingPage() {
  const [nameFilter, setNameFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const servicers = [
    {
      name: 'Citywide Towing',
      phone: '+60 12-345 6789',
      area: 'Central, Setapak, Wangsa Maju',
      state: 'Kuala Lumpur',
    },
    {
      name: 'Rapid Roadside Assist',
      phone: '+60 11-2222 3333',
      area: 'Gombak, Batu Caves, Ampang',
      state: 'Selangor',
    },
    {
      name: 'Highway Recovery Team',
      phone: '+60 10-888 9999',
      area: 'PLUS / NKVE nearby exits (coverage varies by time)',
      state: 'Selangor',
    },
    {
      name: 'Penang Swift Tow',
      phone: '+60 16-777 8888',
      area: 'Georgetown, Butterworth, Bayan Lepas',
      state: 'Penang',
    },
    {
      name: 'JB Express Recovery',
      phone: '+60 17-555 4444',
      area: 'Johor Bahru, Skudai, Iskandar Puteri',
      state: 'Johor',
    },
    {
      name: 'Ipoh Tow & Go',
      phone: '+60 15-333 2222',
      area: 'Ipoh City, Falim, Bercham',
      state: 'Perak',
    },
  ];

  const states = useMemo(
    () => [...new Set(servicers.map((s) => s.state))].sort(),
    []
  );

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    return servicers.filter((s) => {
      const matchesName = !name || s.name.toLowerCase().includes(name);
      const matchesState = !stateFilter || s.state === stateFilter;
      return matchesName && matchesState;
    });
  }, [nameFilter, stateFilter]);

  const toTelHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

  return (
    <main className="container-page space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Towing</h1>
        <p className="mt-2 text-slate-600">Trusted contacts (servicer name, phone number, and coverage area).</p>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search by name…"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 sm:w-48"
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Results */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No towing services match your filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((servicer) => (
              <article key={servicer.name} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{servicer.name}</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{servicer.state}</p>
                    <p className="mt-1 text-sm text-slate-600">Area: {servicer.area}</p>
                  </div>

                  <a
                    href={toTelHref(servicer.phone)}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Call {servicer.phone}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
