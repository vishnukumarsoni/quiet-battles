import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { seriesApi } from '../services';
import { pad } from '../utils/format';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import { EmptyState, ErrorState, Spinner } from '../components/States';

export default function SeriesPage() {
  const { slug } = useParams();
  const { data: s, loading, error, reload } = useFetch(() => seriesApi.get(slug), [slug]);
  useDocumentTitle(s ? `Series ${pad(s.seriesNumber)}: ${s.title}` : 'Series', s?.description);

  if (loading) return <div className="pt-40"><Spinner label="Loading series" /></div>;
  if (error) return <div className="pt-24"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <>
      <section className="relative flex min-h-[78svh] items-end overflow-hidden">
        <Img src={s.coverImage} alt="" eager className="!absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" aria-hidden="true" />
        <div className="container-x relative pb-14 pt-44">
          <nav aria-label="Breadcrumb" className="eyebrow !text-bone/70">
            <Link to="/archive" className="hover:text-bone">The Archive</Link> / Series {pad(s.seriesNumber)}
          </nav>
          <h1 className="mt-5 font-display text-[clamp(3.2rem,10vw,9rem)] leading-[0.88]">
            {s.title.replace('™', '')}<span className="text-clay text-[0.35em] align-top">™</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-bone/80">{s.description}</p>
        </div>
      </section>

      <section className="container-x py-20 md:py-32">
        <div className="mb-14 flex items-baseline justify-between border-b border-graphite pb-5">
          <h2 className="eyebrow">{s.chapters.length} chapters</h2>
          <Link to="/shop" className="link-line text-[11px] uppercase tracking-wider2">Shop the series</Link>
        </div>

        {s.chapters.length === 0 && <EmptyState title="Chapters coming soon" text="This series has no published chapters yet." />}

        <div className="space-y-24 md:space-y-36">
          {s.chapters.map((c, i) => (
            <Reveal key={c.id} className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
              <Link
                to={`/chapters/${c.slug}`}
                className={`block md:col-span-7 ${i % 2 ? 'md:order-2 md:col-start-6' : ''}`}
              >
                <Img src={c.coverImage} alt={`Chapter ${pad(c.chapterNumber)}: ${c.title}`} ratio={i % 2 ? '4/5' : '5/4'} className="w-full" />
              </Link>
              <div className={`md:col-span-4 ${i % 2 ? 'md:order-1 md:col-start-1' : 'md:col-start-9'}`}>
                <p className="font-display text-8xl leading-none text-graphite">{pad(c.chapterNumber)}</p>
                <p className="eyebrow mt-2">Chapter {pad(c.chapterNumber)}</p>
                <h3 className="mt-3 font-display text-4xl leading-[1] sm:text-5xl">{c.title}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ash">{c.description}</p>
                <Link to={`/chapters/${c.slug}`} className="btn mt-8">View chapter <ArrowRight size={14} /></Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
