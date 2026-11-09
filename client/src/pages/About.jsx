import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Img from '../components/Img';
import Reveal from '../components/Reveal';

export default function About() {
  useDocumentTitle('About', 'The idea behind QUIET BATTLES™: clothing for the fights nobody sees, released in chapters.');
  return (
    <div className="container-x">
      <header className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="eyebrow">About</p>
          <h1 className="mt-4 font-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.88]">Strength doesn’t<br />have to be <em className="text-clay">loud.</em></h1>
        </div>
      </header>

      <div className="mt-20 grid gap-12 md:grid-cols-12 md:gap-16">
        <Reveal className="md:col-span-5">
          <Img src="/placeholders/about.jpg" alt="" ratio="4/5" className="w-full" />
        </Reveal>
        <Reveal className="md:col-span-5 md:col-start-7 md:pt-24" delay={100}>
          <div className="space-y-6 text-[17px] leading-[1.8] text-bone/80">
            <p>QUIET BATTLES™ began with an observation: the people we admire most are rarely the loudest. They are the ones who keep showing up, who carry things without announcing it.</p>
            <p>So we make clothing for them. Heavyweight fabrics, soft structure, nothing shouting for attention. Each piece belongs to a chapter, and each chapter belongs to a series, so the collection reads like a story rather than a rack.</p>
            <p>Series 01, <Link to="/archive/series-01" className="link-line text-bone">The Gentle Armor™</Link>, asks a simple question: what if armor were soft?</p>
          </div>
          <Link to="/archive" className="btn mt-12">Enter the archive</Link>
        </Reveal>
      </div>

      <section className="mt-32 grid gap-px border border-graphite bg-graphite md:grid-cols-3">
        {[
          ['Made to last', 'Heavy cotton, reinforced seams, garment washing. Pieces that improve with wear.'],
          ['Released in chapters', 'No seasons and no restocks for the sake of it. Each series tells one story, then rests.'],
          ['Quiet by design', 'No oversized logos. If you know, you know. If you don’t, that’s fine too.'],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 90} className="bg-ink p-8 sm:p-10">
            <p className="font-display text-6xl text-graphite">0{i + 1}</p>
            <h2 className="mt-6 font-display text-3xl">{t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">{d}</p>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
