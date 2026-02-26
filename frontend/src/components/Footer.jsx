export default function Footer() {
  const updates = [
    {
      version: 'v1.3.0',
      date: 'Feb 26, 2026',
      notes: 'Added services listing per workshop, towing assistance page, and admin approval workflow for workshops.',
    },
    {
      version: 'v1.2.0',
      date: 'Feb 25, 2026',
      notes: 'Workshop image support, improved map view with clustering, and opening-hours display.',
    },
    {
      version: 'v1.1.0',
      date: 'Feb 24, 2026',
      notes: 'User reviews & ratings system, favorites list, and nearby workshop search by GPS.',
    },
    {
      version: 'v1.0.0',
      date: 'Feb 23, 2026',
      notes: 'Initial release — auth (JWT + Google), workshop listings, and PWA support.',
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* About RevHaus */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              About RevHaus
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              RevHaus is a community-driven platform built to help conti owners quickly locate
              trusted workshops nearby. Developed by capik7.5r with a passion for cars and technology, the app aims to connect users
              with workshops conveniently. Whether you need a quick oil change or major repairs, RevHaus is here to help you get back on the road with confidence. We welcome feedback and contributions to make the platform even better!
            </p>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://www.tiktok.com/@capik7.5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  TikTok — @capik7.5
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Response time: within 24 hours.
            </p>
          </div>

          {/* Update Log */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Update Log
            </h3>
            <ul className="space-y-3">
              {updates.map((u) => (
                <li key={u.version}>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs font-mono text-slate-200">
                      {u.version}
                    </span>
                    <span className="text-xs text-slate-500">{u.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{u.notes}</p>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} RevHaus. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
