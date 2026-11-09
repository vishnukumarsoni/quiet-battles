import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { chaptersApi } from '../services';
import { pad, formatPrice } from '../utils/format';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import StoryContent from '../components/StoryContent';
import { ErrorState, Spinner } from '../components/States';

export default function ChapterPage() {
  const { slug } = useParams();
  const { data: c, loading, error, reload } = useFetch(() => chaptersApi.get(slug), [slug]);
  useDocumentTitle(c ? `Chapter ${pad(c.chapterNumber)}: ${c.title}` : 'Chapter', c?.description);

  if (loading) return <div className="pt-40"><Spinner label="Loading chapter" /></div>;
  if (error) return <div className="pt-24"><ErrorState error={error} onRetry={reload} /></div>;

  const product = c.relatedProduct;
  return (
    <article>
      {/* hero */}
      <header className="relative flex min-h-[92svh] items-end overflow-hidden">
        <Img src={c.coverImage} alt="" eager className="!absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" aria-hidden="true" />
        <div className="container-x relative pb-14 pt-44">
          <nav aria-label="Breadcrumb" className="eyebrow !text-bone/70">
            <Link to="/archive" className="hover:text-bone">Archive</Link> /{' '}
            <Link to={`/archive/${c.series.slug}`} className="hover:text-bone">Series {pad(c.series.seriesNumber)}</Link>
          </nav>
          <p className="mt-8 font-display text-[clamp(5rem,16vw,14rem)] leading-[0.75] text-bone/20">{pad(c.chapterNumber)}</p>
          <h1 className="mt-3 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.9]">{c.title}</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-bone/80">{c.description}</p>
        </div>
      </header>

      {/* story */}
      <section className="container-x py-20 md:py-32">
        <div className="mx-auto max-w-2xl">
          <StoryContent text={c.storyContent} gallery={c.galleryImages} title={c.title} />
        </div>
      </section>

      {/* related product */}
      {product && (
        <section className="border-y border-graphite bg-coal">
          <div className="container-x grid items-center gap-10 py-20 md:grid-cols-12 md:py-28">
            <Reveal className="md:col-span-5">
              <Link to={`/products/${product.slug}`}>
                <Img src={product.images?.[0]} alt={product.name} ratio="4/5" className="w-full" />
              </Link>
            </Reveal>
            <Reveal className="md:col-span-5 md:col-start-8" delay={100}>
              <p className="eyebrow">The piece from this chapter</p>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">{product.name}</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-ash">{product.description}</p>
              <p className="mt-6 font-display text-3xl">{formatPrice(product.price)}</p>
              <Link to={`/products/${product.slug}`} className="btn btn-solid mt-8">
                {product.stock > 0 ? 'View & add to cart' : 'View piece'} <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* next chapter */}
      <section className="container-x pt-20 md:pt-28">
        {c.nextChapter ? (
          <Link to={`/chapters/${c.nextChapter.slug}`} className="group grid items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="eyebrow">Explore next chapter</p>
              <p className="mt-6 font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] transition-colors group-hover:text-clay">
                <span className="mr-4 text-graphite">{pad(c.nextChapter.chapterNumber)}</span>
                {c.nextChapter.title}
              </p>
              <span className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-wider2">
                Continue the story <ArrowRight size={14} className="transition-transform group-hover:translate-x-2" />
              </span>
            </div>
            <Img src={c.nextChapter.coverImage} alt="" ratio="5/4" className="w-full md:col-span-4 md:col-start-9" />
          </Link>
        ) : (
          <div className="text-center">
            <p className="eyebrow">The end of Series {pad(c.series.seriesNumber)}</p>
            <p className="mt-5 font-display text-5xl sm:text-7xl">That was the last chapter.</p>
            <Link to="/archive" className="btn mt-10">Back to the archive</Link>
          </div>
        )}
        {c.prevChapter && (
          <p className="mt-16 border-t border-graphite pt-6 text-sm text-ash">
            Previously: <Link to={`/chapters/${c.prevChapter.slug}`} className="link-line text-bone">{pad(c.prevChapter.chapterNumber)} · {c.prevChapter.title}</Link>
          </p>
        )}
      </section>
    </article>
  );
}
