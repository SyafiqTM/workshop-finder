export default function TowingPage() {
  const servicers = [
    {
      name: 'Citywide Towing',
      phone: '+60 12-345 6789',
      area: 'Kuala Lumpur (Central, Setapak, Wangsa Maju)'
    },
    {
      name: 'Rapid Roadside Assist',
      phone: '+60 11-2222 3333',
      area: 'Selangor (Gombak, Batu Caves, Ampang)'
    },
    {
      name: 'Highway Recovery Team',
      phone: '+60 10-888 9999',
      area: 'PLUS / NKVE nearby exits (coverage varies by time)'
    }
  ];

  const toTelHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

  return (
    <main className="container-page space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Towing</h1>
        <p className="mt-2 text-slate-600">Trusted contacts (servicer name, phone number, and coverage area).</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {servicers.map((servicer) => (
            <article key={servicer.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{servicer.name}</h2>
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
      </section>
    </main>
  );
}
