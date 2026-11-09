import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { productsApi, seriesApi } from '../services';
import { pad, formatPrice } from '../utils/format';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import { GridSkeleton } from '../components/States';

export default function Home() {
  useDocumentTitle(null, 'QUIET BATTLES™ is a premium fashion label told in chapters. Explore Series 01, The Gentle Armor™. Wear your battles.');

  const featured = useFetch(() => productsApi.list({ featured: 'true', sort: 'newest', limit: 4 }), []);
  const series = useFetch(() => seriesApi.get('series-01'), []);

  const [spotlight, ...collection] = featured.data || [];
  const s = series.data;

  return (
    <>
      {/* 1. HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <Img src="/placeholders/hero.jpg" alt="" eager className="!absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10" aria-hidden="true" />
        <div className="container-x relative pb-14 pt-40 sm:pb-20">
          <p className="eyebrow !text-bone/70">Series 01 · The Gentle Armor™</p>
          <h1 className="mt-6 font-display text-[clamp(3.4rem,13vw,11.5rem)] font-medium leading-[0.86] tracking-tight">
            Wear your<br />
            <em className="font-normal text-clay">battles.</em>
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/archive/series-01" className="btn btn-solid">Enter the archive <ArrowRight size={14} /></Link>
            <Link to="/shop" className="btn">Shop the series</Link>
          </div>
        </div>
      </section>

      {/* 2. BRAND INTRO */}
      <section className="container-x grid gap-10 py-28 md:grid-cols-12 md:py-40">
        <Reveal className="md:col-span-3">
          <p className="eyebrow">The label</p>
        </Reveal>
        <Reveal className="md:col-span-8 md:col-start-5" delay={100}>
          <p className="font-display text-[clamp(1.9rem,4vw,3.4rem)] leading-[1.18]">
            Armor is usually loud. Ours is not. QUIET BATTLES™ makes clothing for the fights nobody sees: heavyweight, softly cut, and released as <em className="text-clay">chapters</em>, not seasons.
          </p>
          <Link to="/about" className="link-line mt-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-wider2">Read our story <ArrowUpRight size={13} /></Link>
        </Reveal>
      </section>

      {/* 3. FEATURED COLLECTION (staggered grid, not a flat row) */}
      <section className="container-x">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 className="mt-3 font-display text-5xl sm:text-6xl">The pieces</h2>
          </div>
          <Link to="/shop" className="link-line hidden text-[11px] uppercase tracking-wider2 sm:inline-block">View all</Link>
        </Reveal>

        {featured.loading ? (
          <GridSkeleton count={3} />
        ) : featured.error ? (
          <p className="py-10 text-sm text-ash">The collection could not be loaded right now. <button className="underline" onClick={featured.reload}>Retry</button></p>
        ) : collection.length === 0 ? (
          <p className="py-10 text-sm text-ash">New pieces are on their way.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {collection.map((p, i) => (
              <Reveal key={p.id} delay={i * 90} className={i === 1 ? 'lg:mt-24' : i === 2 ? 'lg:mt-10' : ''}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 4. SERIES 01 PREVIEW */}
      <section className="container-x mt-32 grid gap-12 md:mt-48 md:grid-cols-12">
        <Reveal className="md:col-span-6 md:sticky md:top-28 md:self-start">
          <Link to="/archive/series-01" className="group block">
            <Img src={s?.coverImage || '/placeholders/series-01.jpg'} alt="Series 01, The Gentle Armor" ratio="4/5" className="w-full" />
          </Link>
        </Reveal>
        <div className="md:col-span-5 md:col-start-8 md:py-10">
          <Reveal>
            <p className="eyebrow">Series 01</p>
            <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">The Gentle Armor<span className="text-clay text-3xl align-top">™</span></h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ash">{s?.description}</p>
          </Reveal>
          <ol className="mt-12 border-t border-graphite">
            {(s?.chapters || []).map((c) => (
              <li key={c.id} className="border-b border-graphite">
                <Link to={`/chapters/${c.slug}`} className="group flex items-baseline gap-5 py-5">
                  <span className="w-8 text-[11px] tracking-wider2 text-ash">{pad(c.chapterNumber)}</span>
                  <span className="flex-1 font-display text-2xl transition-colors group-hover:text-clay sm:text-3xl">{c.title}</span>
                  <ArrowUpRight size={16} className="text-ash opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ol>
          <Link to="/archive/series-01" className="btn mt-10">View series <ArrowRight size={14} /></Link>
        </div>
      </section>

      {/* 5. FEATURED PRODUCT */}
      {spotlight && (
        <section className="mt-32 border-y border-graphite bg-coal md:mt-48">
          <div className="container-x grid items-center gap-12 py-20 md:grid-cols-12 md:py-28">
            <Reveal className="md:col-span-5 md:col-start-8 md:order-2">
              <Link to={`/products/${spotlight.slug}`}>
                <Img src={spotlight.images?.[1] || spotlight.images?.[0]} alt={spotlight.name} ratio="4/5" className="w-full" />
              </Link>
            </Reveal>
            <Reveal className="md:col-span-6 md:order-1">
              <p className="eyebrow">Piece in focus</p>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">{spotlight.name}</h2>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ash">{spotlight.description}</p>
              <p className="mt-8 font-display text-3xl">{formatPrice(spotlight.price)}</p>
              <Link to={`/products/${spotlight.slug}`} className="btn btn-solid mt-8">View piece <ArrowRight size={14} /></Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* 6. STORYTELLING */}
      <section className="relative mt-32 md:mt-48">
        <Img src="/placeholders/story.jpg" alt="" className="h-[70vh] min-h-[420px] w-full" />
        <div className="absolute inset-0 flex items-center bg-ink/55">
          <Reveal className="container-x">
            <p className="mx-auto max-w-4xl text-center font-display text-[clamp(1.8rem,4.4vw,4rem)] italic leading-[1.15]">
              “Nobody clapped when you got out of bed. It still counted.”
            </p>
            <p className="mt-6 text-center eyebrow !text-bone/70">Chapter 01 · The Beginning</p>
          </Reveal>
        </div>
      </section>

      {/* 7. NEWSLETTER */}
      <section className="container-x grid gap-10 py-28 md:grid-cols-12 md:py-40">
        <Reveal className="md:col-span-6">
          <p className="eyebrow">Newsletter</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">Hear when the next chapter drops.</h2>
        </Reveal>
        <Reveal className="md:col-span-4 md:col-start-9 md:self-end" delay={100}>
          <Newsletter />
        </Reveal>
      </section>
    </>
  );
}
