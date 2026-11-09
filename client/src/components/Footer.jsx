import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const s = useSettings();
  const socials = [
    { href: s.instagram, label: 'Instagram', Icon: Instagram },
    { href: s.twitter, label: 'X', Icon: Twitter },
    { href: s.youtube, label: 'YouTube', Icon: Youtube },
  ].filter((x) => x.href);

  return (
    <footer className="mt-32 border-t border-graphite">
      <div className="container-x grid gap-14 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-5xl leading-none tracking-wide sm:text-6xl">
            Wear your <em className="text-clay">battles.</em>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ash">
            Clothing told in chapters. Cut quietly, made to be worn close, for the fights nobody else sees.
          </p>
        </div>

        <nav className="md:col-span-3 md:col-start-7" aria-label="Footer">
          <p className="eyebrow mb-5">Explore</p>
          <ul className="space-y-3 text-sm">
            {[['/archive', 'The Archive'], ['/archive/series-01', 'Series 01'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact'], ['/cart', 'Cart']].map(([to, label]) => (
              <li key={to}><Link to={to} className="text-bone/80 hover:text-clay transition-colors">{label}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="eyebrow mb-5">Contact</p>
          <ul className="space-y-3 text-sm text-bone/80">
            {s.contactEmail && <li><a href={`mailto:${s.contactEmail}`} className="hover:text-clay transition-colors">{s.contactEmail}</a></li>}
            {s.contactPhone && <li>{s.contactPhone}</li>}
            {s.address && <li className="text-ash">{s.address}</li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-4">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-ash hover:text-clay transition-colors">
                    <Icon size={18} strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-graphite">
        <div className="container-x flex flex-col gap-2 py-5 text-[11px] uppercase tracking-wider2 text-ash sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} QUIET BATTLES™</span>
          <span>Demo store · no payments are taken</span>
        </div>
      </div>
    </footer>
  );
}
