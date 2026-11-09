import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { seriesApi } from '../services';
import { pad } from '../utils/format';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import { EmptyState, ErrorState, Spinner } from '../components/States';

export default function Archive() {
  useDocumentTitle('The Archive', 'Every QUIET BATTLES™ series, in order. Start with Series 01, The Gentle Armor™.');
  const { data, loading, error, reload } = useFetch(() => seriesApi.list(), []);

  return (
    <div className="container-x pb-10">
      <header className="grid gap-6 border-b border-graphite pb-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="eyebrow">The Archive</p>
          <h1 className="mt-4 font-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.88]">Every series,<br /><em className="text-clay">in order.</em></h1>
        </div>
        <p className="self-end text-[15px] leading-relaxed text-ash md:col-span-4 md:col-start-9">
          We release clothing as stories. Each series is a set of chapters, and each chapter is a single piece.
        </p>
      </header>

      {loading && <Spinner label="Opening the archive" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState title="The archive is empty" text="No series have been published yet. Check back soon." action={{ to: '/shop', label: 'Visit the shop' }} />
      )}

      <div className="divide-y divide-graphite">
        {(data || []).map((s, i) => (
          <Reveal key={s.id} className="grid gap-8 py-14 md:grid-cols-12 md:gap-12 md:py-20">
            <Link to={`/archive/${s.slug}`} className={`md:col-span-6 ${i % 2 ? 'md:order-2 md:col-start-7' : ''}`}>
              <Img src={s.coverImage} alt={`${s.title}, series cover`} ratio="4/5" className="w-full" />
            </Link>
            <div className={`flex flex-col justify-end md:col-span-5 ${i % 2 ? 'md:order-1 md:col-start-1' : 'md:col-start-8'}`}>
              <p className="font-display text-[clamp(5rem,12vw,10rem)] leading-none text-graphite">{pad(s.seriesNumber)}</p>
              <p className="eyebrow mt-2">Series {pad(s.seriesNumber)} · {s.chapterCount} chapters</p>
              <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">{s.title}</h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">{s.description}</p>
              <Link to={`/archive/${s.slug}`} className="btn mt-9 self-start">View series <ArrowRight size={14} /></Link>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
