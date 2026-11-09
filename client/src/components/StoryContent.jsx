import Img from './Img';

// Chapter text is saved as plain text with a tiny format the admin can type:
//   blank line  = new paragraph        > text   = pull quote
//   ## text     = sub-heading          [[image 2]] = show the 2nd gallery image here
// Using plain text (not raw HTML) means nothing a writer types can inject scripts.
export function parseStory(text = '') {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const img = block.match(/^\[\[image\s+(\d+)\]\]$/i);
      if (img) return { type: 'image', index: Number(img[1]) - 1 };
      if (block.startsWith('## ')) return { type: 'heading', text: block.slice(3) };
      if (block.startsWith('> ')) return { type: 'quote', text: block.replace(/^>\s?/gm, '') };
      return { type: 'p', text: block };
    });
}

export default function StoryContent({ text, gallery = [], title }) {
  const blocks = parseStory(text);
  const used = new Set(blocks.filter((b) => b.type === 'image').map((b) => b.index));
  const leftovers = gallery.map((src, i) => ({ src, i })).filter(({ i }) => !used.has(i));
  let firstParagraph = true;

  return (
    <div className="story">
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return <h2 key={i} className="mb-6 mt-16 font-display text-3xl sm:text-4xl">{b.text}</h2>;
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} className="my-14 border-l border-clay pl-6 font-display text-3xl italic leading-snug sm:text-[2.6rem] sm:leading-[1.15]">
              {b.text}
            </blockquote>
          );
        }
        if (b.type === 'image') {
          const src = gallery[b.index];
          if (!src) return null;
          return (
            <figure key={i} className="-mx-5 my-16 sm:mx-0 lg:-mx-24">
              <Img src={src} alt={`${title}, editorial image ${b.index + 1}`} ratio="16/9" className="w-full" />
            </figure>
          );
        }
        const cls = firstParagraph ? 'drop' : '';
        firstParagraph = false;
        return <p key={i} className={`text-[17px] leading-[1.85] text-bone/85 ${cls}`}>{b.text}</p>;
      })}

      {leftovers.length > 0 && (
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {leftovers.map(({ src, i }) => (
            <Img key={i} src={src} alt={`${title}, image ${i + 1}`} ratio="4/5" className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
