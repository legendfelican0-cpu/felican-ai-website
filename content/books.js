// Per-book pages. Four published titles are a real authority asset currently spending
// 116 words on a single URL.
//
// Every book links its author to one shared Person node (/#founder), which is the same
// node the Organization graph points at. That single identity, referenced from books,
// articles and the about page, is what builds an author entity search engines can
// actually resolve.
//
// Titles and cover filenames come from the existing data in public/books/index.html.
// Purchase links are left empty rather than guessed; fill in the real Amazon URLs.

export const BOOKS = [
  {
    slug: 'the-big-ai-book',
    name: 'The BIG AI Book',
    cover: '/book-big-ai.jpg',
    title: 'The BIG AI Book by Lee Felican Jr. | Felican AI',
    description:
      'The BIG AI Book by Lee Felican Jr. — a plain-language guide to what AI actually is, what it can do for a business, and how to tell the difference between capability and marketing.',
    tagline: 'Understanding AI without the hype or the maths.',
    buyUrl: '',
    about: [
      'Most writing about AI is either a technical text that assumes a machine learning background or a breathless forecast that assumes nothing at all. The BIG AI Book is the middle: a plain-language account of what these systems are, how they work well enough to reason about, and where the line between real capability and marketing sits.',
      'It is written for the person who has to make a decision about AI — a business owner, a manager, a professional whose work is changing — rather than for somebody planning to build a model.',
    ],
    forYouIf: [
      'You keep nodding along in AI conversations and would rather actually understand it.',
      'You need to judge vendor claims without taking them on trust.',
      'You want the concepts, not the mathematics.',
      'You are deciding whether AI belongs in your business and want to reason about it properly.',
    ],
    related: [
      { href: '/guides/private-ai/', label: 'The private AI guide', note: 'The business deployment side in depth' },
      { href: '/education/', label: 'Education', note: 'Courses and programmes' },
    ],
  },
  {
    slug: 'stop-being-nice-to-ai',
    name: 'Stop Being Nice to AI',
    cover: '/book-stop-being-nice.jpg',
    title: 'Stop Being Nice to AI by Lee Felican Jr. | Felican AI',
    description:
      'Stop Being Nice to AI by Lee Felican Jr. — how to prompt effectively by being direct, specific and demanding instead of polite and vague.',
    tagline: 'Prompting is a skill, and politeness is not part of it.',
    buyUrl: '',
    about: [
      'People get poor results from AI for a consistent and unexpected reason: they are too polite. Hedged, apologetic, vague requests produce hedged, vague answers, and the user concludes the tool is weak.',
      'Stop Being Nice to AI is about being direct. Specific instructions, stated constraints, explicit output formats, and a willingness to reject a first answer and demand a better one. It is a practical method rather than a list of prompt tricks that stop working when the models change.',
    ],
    forYouIf: [
      'You use AI daily and suspect you are getting less out of it than you should.',
      'Your prompts produce generic answers that need heavy editing.',
      'You want a method that survives the next model release.',
      'You are training a team and need something you can hand them.',
    ],
    related: [
      { href: '/services/ai-training-and-workshops/', label: 'AI training and workshops', note: 'The same method, taught hands-on' },
      { href: '/services/corporate-training/', label: 'Corporate training', note: 'For a whole team' },
    ],
  },
  {
    slug: 'dont-be-replaced',
    name: "Don't Be Replaced",
    cover: '/book-dont-be-replaced.jpg',
    title: "Don't Be Replaced by Lee Felican Jr. | Felican AI",
    description:
      "Don't Be Replaced by Lee Felican Jr. — how to stay valuable at work as AI takes over tasks, and which skills actually hold their value.",
    tagline: 'Staying valuable when the tasks change.',
    buyUrl: '',
    about: [
      'The honest version of the "will AI take my job" question is narrower and more useful: which parts of your job are tasks, which parts are judgement, and what happens to your value when the tasks get automated.',
      "Don't Be Replaced works through that distinction and what to do about it — which skills hold their value, which are already depreciating, and how to position yourself as the person who directs the work rather than the person whose work was the output.",
    ],
    forYouIf: [
      'Your role involves work AI is visibly getting better at.',
      'You want a clear read rather than reassurance or alarm.',
      'You are deciding what to learn next and want it to still matter in five years.',
      'You manage people who are anxious about this and need to talk about it honestly.',
    ],
    related: [
      { href: '/services/corporate-training/', label: 'Corporate training', note: 'Bringing a team through the change' },
      { href: '/education/', label: 'Education', note: 'Programmes and courses' },
    ],
  },
  {
    slug: 'big-ballas-guide',
    name: 'Big Ballas Guide',
    cover: '/book-big-ballas.jpg',
    title: 'Big Ballas Guide by Lee Felican Jr. | Felican AI',
    description:
      'Big Ballas Guide by Lee Felican Jr. — a practical guide to making money with AI, written around what actually works rather than what sells courses.',
    tagline: 'Making money with AI, minus the course-selling.',
    buyUrl: '',
    about: [
      'There is an enormous amount of content about making money with AI and most of it is selling the content. Big Ballas Guide is the practical version: where the real opportunities are, what they require, and which of the popular ideas do not survive contact with a paying customer.',
      'Written from the position of someone building and selling AI systems to real businesses, which is a different vantage point from someone selling a course about it.',
    ],
    forYouIf: [
      'You want to build something with AI that people pay for.',
      'You have been through the free content and want substance.',
      'You would rather know what fails before you spend months on it.',
      'You are weighing several AI business ideas and need a way to judge them.',
    ],
    related: [
      { href: '/products/', label: 'What we build', note: 'The products behind the writing' },
      { href: '/case-studies/', label: 'Client work', note: 'Real deployments' },
    ],
  },
];
