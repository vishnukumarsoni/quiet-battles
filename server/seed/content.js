// Demo content for the assessment. Images are generated placeholders in client/public/placeholders.
// Everything here can be edited or replaced from the admin panel afterwards.
const img = (name) => `/placeholders/${name}.jpg`;
const SIZES = ['S', 'M', 'L', 'XL'];

export const products = [
  {
    ageDays: 5,
    name: 'The Beginning Tee',
    slug: 'the-beginning-tee',
    category: 'Tops',
    price: 3200,
    stock: 40,
    featured: true,
    description:
      'A heavyweight tee for the mornings nobody sees. Cut boxy through the body with a dropped shoulder, and a collar that keeps its shape long after the hundredth wash.',
    details: [
      '380 gsm brushed cotton jersey',
      'Boxy fit, dropped shoulder',
      'Ribbed collar, double-stitched hem',
      'Garment washed before shipping',
      'Cold wash, dry flat',
    ],
    images: [img('p1-1'), img('p1-2'), img('p1-3')],
  },
  {
    ageDays: 4,
    name: 'The Silent Strength Hoodie',
    slug: 'the-silent-strength-hoodie',
    category: 'Sweats',
    price: 7900,
    stock: 25,
    featured: true,
    description:
      'Heavy on purpose. A double-layered hood that holds its shape, a pouch pocket deep enough for both hands and a bad day, and seams reinforced at every point of strain.',
    details: [
      '480 gsm French terry, brushed inside',
      'Double-layered hood with flat drawcord',
      'Deep pouch pocket',
      'Relaxed fit, true to size',
      'Cold wash, hang to dry',
    ],
    images: [img('p2-1'), img('p2-2'), img('p2-3')],
  },
  {
    ageDays: 3,
    name: 'The Healing Crewneck',
    slug: 'the-healing-crewneck',
    category: 'Sweats',
    price: 6400,
    stock: 30,
    featured: true,
    description:
      'Brushed soft on the inside and finished with contrast stitching along the shoulder and hem, a nod to visible repair. Made for the days you would rather not be touched by anything stiff.',
    details: [
      '420 gsm loopback cotton, brushed inside',
      'Contrast shoulder and hem stitching',
      'Regular fit, slightly cropped body',
      'Pre-washed for a soft hand-feel',
      'Cold wash, dry flat',
    ],
    images: [img('p4-1'), img('p4-2'), img('p4-3')],
  },
  {
    ageDays: 1, // newest featured product, so it is the home page hero product
    name: 'The Inner Battle Overshirt',
    slug: 'the-inner-battle-overshirt',
    category: 'Outerwear',
    price: 9800,
    stock: 18,
    featured: true,
    description:
      'The most literal armor in Series 01. Structured through the shoulder, soft everywhere else, with a collar that stands when you want it to and folds away when you do not. Button it up or leave it open. Both are allowed.',
    details: [
      'Heavy cotton twill, garment dyed',
      'Structured shoulder, relaxed body',
      'Two chest pockets, hidden inner pocket',
      'Corozo nut buttons',
      'Cold wash, line dry',
    ],
    images: [img('p3-1'), img('p3-2'), img('p3-3')],
  },
  {
    ageDays: 2,
    name: 'The Becoming Long Sleeve',
    slug: 'the-becoming-long-sleeve',
    category: 'Tops',
    price: 4600,
    stock: 4, // deliberately low so the admin "low stock" panel has something to show
    featured: false,
    description:
      'The simplest piece in the series, and the last one. By now the armor is not about protection, it is just clothing again: something you put on without thinking, because it feels like you.',
    details: [
      '300 gsm combed cotton jersey',
      'Straight fit, long ribbed cuffs',
      'Tubular body, no side seams',
      'Garment washed before shipping',
      'Cold wash, dry flat',
    ],
    images: [img('p5-1'), img('p5-2'), img('p5-3')],
  },
];

export const series = {
  title: 'The Gentle Armor™',
  slug: 'series-01',
  seriesNumber: 1,
  status: 'published',
  coverImage: img('series-01'),
  description:
    'Armor is usually loud. This series asks what it would look like if it were soft: cut quietly, worn close, and made for the fights nobody else sees. Five chapters, five pieces, one slow story.',
};

// storyContent mini-format (see README): blank line = new paragraph, "> " = pull quote,
// "## " = sub-heading, [[image 1]] = place the first gallery image here.
export const chapters = [
  {
    chapterNumber: 1,
    title: 'The Beginning',
    slug: 'the-beginning',
    productSlug: 'the-beginning-tee',
    description: 'Before the armor, there was just a person and a morning that felt heavier than it should.',
    images: ['ch1-cover', 'ch1-a', 'ch1-b'],
    storyContent: `It never starts with a drum roll. It starts on an ordinary Tuesday, in a body that is tired in a way sleep doesn't fix, with one small decision to get up anyway.

> Nobody clapped when you got out of bed. It still counted.

We began the label with that decision. Not the big moments that get photographed, but the quiet mornings in between, where most of the real work happens and nobody is watching.

[[image 1]]

The first piece of Series 01 is cut for those mornings. Heavyweight cotton, a dropped shoulder, a hem that lands where your hands naturally rest. It doesn't ask to be noticed. It asks to be worn, over and over, until it knows the shape of you.

## Where it begins

Every chapter in this series starts the same way: with something small and true. A first step. A first honest sentence. A first day of being a little gentler with yourself than you were yesterday.

[[image 2]]`,
  },
  {
    chapterNumber: 2,
    title: 'The Silent Strength',
    slug: 'the-silent-strength',
    productSlug: 'the-silent-strength-hoodie',
    description: 'Some strength never raises its voice. It just keeps showing up, quietly, in a good hoodie.',
    images: ['ch2-cover', 'ch2-a', 'ch2-b'],
    storyContent: `The loudest person in the room is rarely the strongest one in it. Strength, the kind we mean, is mostly administrative: the call you make, the bill you pay, the conversation you finally have.

> Quiet isn't the same as small.

[[image 1]]

This chapter is about the people who carry things without announcing it. The ones who answer "I'm fine" and mean "I'm managing", and who deserve a garment that can keep up without drawing attention to the effort.

## Built to carry

The hoodie in this chapter is heavy on purpose. A double-layered hood that holds its shape, a pouch pocket deep enough for both hands and a bad day, seams reinforced at every point of strain.

[[image 2]]

You won't see the strength in it from across the street. You'll feel it when you put it on.`,
  },
  {
    chapterNumber: 3,
    title: 'The Inner Battle',
    slug: 'the-inner-battle',
    productSlug: 'the-inner-battle-overshirt',
    description: 'The hardest rooms are the ones inside. This is the chapter we wrote with the lights off.',
    images: ['ch3-cover', 'ch3-a', 'ch3-b'],
    storyContent: `Some battles have no opponent you could point to. They happen between the ears, at 2 a.m., in the space between what you know and what you feel.

> You can be your own weather and still choose what to wear.

We didn't want this chapter to be dramatic. The inner battle is mostly ordinary: the loop of a thought, the tightness in the chest on a Sunday evening, the effort of explaining something that doesn't have a name yet.

[[image 1]]

## A layer you can close

The overshirt is the most literal armor in the series. Structured through the shoulder, soft everywhere else, with a collar that stands when you want it to and folds away when you don't. Button it all the way up, or leave it open. Both are allowed.

[[image 2]]

Whatever is happening inside, the outside can still be steady. That's all we're offering. It turns out to be a lot.`,
  },
  {
    chapterNumber: 4,
    title: 'The Healing',
    slug: 'the-healing',
    productSlug: 'the-healing-crewneck',
    description: 'Repair is a quiet kind of resistance. Here, the mended seam is the point.',
    images: ['ch4-cover', 'ch4-a', 'ch4-b'],
    storyContent: `Healing is not a straight line, and it is rarely tidy. Good weeks are followed by flat ones. Old things resurface on new days. Progress mostly looks like staying.

> A mended seam is still a seam. Wear it where people can see.

[[image 1]]

We borrowed from the old idea of visible repair: instead of hiding where something was fixed, you let it show. The crewneck in this chapter carries contrast stitching along the shoulder and hem. Not as decoration. As a record that it was made carefully, and will be looked after.

## Slow on purpose

Brushed on the inside, washed before it reaches you, and cut to sit comfortably on the days when you'd rather not be touched by anything stiff. Rest is part of the work.

[[image 2]]`,
  },
  {
    chapterNumber: 5,
    title: 'The Becoming',
    slug: 'the-becoming',
    productSlug: 'the-becoming-long-sleeve',
    description: 'Not a finish line. A shape you grow into, one season at a time.',
    images: ['ch5-cover', 'ch5-a', 'ch5-b'],
    storyContent: `There is no day when the battle ends and you are finally done becoming. There's just a slow change in how you carry it: lighter shoulders, a longer exhale, a bit more room.

> You're not who you were. You're not yet who you'll be. That's the whole point.

[[image 1]]

The long sleeve closing this series is the simplest piece in it, and we think that's right. By now the armor isn't about protection. It's just clothing again: something you put on without thinking, because it feels like you.

## What comes next

Series 01 ends here, but the archive stays open. New chapters will keep arriving, because the story doesn't stop when the series does.

[[image 2]]`,
  },
];

export { SIZES };
