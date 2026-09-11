// Single source of truth for everything that appears on more than one page:
// the organisation identity, the social profiles that disambiguate the brand,
// navigation, and the footer link columns.
//
// Why this file exists: the Organization/WebSite JSON-LD graph used to be
// copy-pasted into all thirteen pages. With ~70 pages that is unmaintainable and
// guarantees drift, so every page now renders its <head> and schema from here.

export const ORIGIN = 'https://felican.ai';

export const ORG = {
  name: 'Felican AI',
  legalName: 'Felican AI',
  url: `${ORIGIN}/`,
  email: 'ai@felican.ai',
  telephone: '+1-561-235-0799',
  telephoneDisplay: '(561) 235-0799',
  logo: `${ORIGIN}/logo-mark.png`,
  image: `${ORIGIN}/og.png`,
  description:
    'Felican AI is a team of more than ten certified AI professionals building practical AI products, private AI systems, custom automations, integrations, and training for businesses in any industry.',
  founder: {
    name: 'Lee Felican Jr.',
    // The profile page and its URL use the formal spelling. Declared as alternateName
    // so a search for either name resolves to the same person.
    alternateName: 'Lehem Felican Jr',
    jobTitle: 'Founder of Felican AI and Director of Artificial Intelligence at Resolution Economics',
    description:
      'Founder of Felican AI. Thirty years building systems for regulated industries — federal defense, financial services, healthcare, energy, blockchain and legal technology — and author of four books on AI.',
    // The canonical page about him, served by the profile app on the same domain.
    profilePath: '/Lehem-Felican-Jr',
  },
  // Service-area business: the owner chose to publish the served area rather than a
  // street address. Google Business Profile should be configured the same way, as a
  // service-area business, so the profile and this markup agree.
  areaServed: [
    'Palm Beach County, Florida',
    'Broward County, Florida',
    'Miami-Dade County, Florida',
    'Florida',
    'United States',
  ],
  addressRegion: 'FL',
  addressCountry: 'US',
  knowsAbout: [
    'Artificial intelligence',
    'Private AI deployment',
    'Self-hosted large language models',
    'AI receptionists and voice agents',
    'Intelligent document processing',
    'Business process automation',
    'AI integration',
    'AI governance and auditing',
    'AI cost optimisation',
    'AI training',
  ],
};

// sameAs is the primary mechanism search engines use to resolve "Felican AI" as a
// distinct entity. It matters unusually much here: the name collides with Felician
// University, felican.net, felican.in and felican.now.site, and nothing off-site
// currently confirms the company exists.
//
// ONLY fill in profiles that genuinely exist and genuinely belong to Felican AI.
// An empty string is skipped entirely — a sameAs pointing at a 404 or at someone
// else's profile is worse than no sameAs at all.
// `person: true` marks a profile that belongs to the founder rather than the company;
// those go into the Person node's sameAs, the rest into the Organization's.
//
// `footer: false` keeps an entry out of the footer's Follow column — useful for a
// third-party profile that corroborates the entity for search engines but is not
// somewhere we are asking visitors to follow us.
//
// ONLY fill in a URL that genuinely exists and genuinely belongs to the named subject.
// A sameAs pointing at a 404, or at a different person or company with a similar name,
// is worse than no sameAs at all — it teaches search engines the wrong entity.
export const SOCIAL = [
  { label: 'LinkedIn', url: '', handle: '' },
  { label: 'YouTube', url: '', handle: '' },
  { label: 'X', url: '', handle: '' },
  { label: 'Facebook', url: '', handle: '' },
  { label: 'Instagram', url: '', handle: '' },
  { label: 'GitHub', url: '', handle: '' },

  // --- the founder's own profiles ---
  // Verified 2026-09-11 from the link on his own CV page at /Lehem-Felican-Jr, so the
  // two reference each other — which is what makes the entity resolvable.
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/lee-felican-jr',
    handle: 'lee-felican-jr',
    person: true,
  },
  // Verified 2026-09-11: a real employer profile page about him, which corroborates
  // the Person entity independently of felican.ai. Not shown in the footer.
  {
    label: 'Resolution Economics profile',
    url: 'https://resecon.com/team/lehem-felican-jr/',
    person: true,
    footer: false,
  },
];

export const socialLive = () => SOCIAL.filter(s => s.url && /^https:\/\//.test(s.url));
export const companySocial = () => socialLive().filter(s => !s.person);
export const personSocial = () => socialLive().filter(s => s.person);
// Only entries we actively want visitors to follow appear in the footer.
export const footerSocial = () => socialLive().filter(s => !s.person && s.footer !== false);

export const NAV = [
  { label: 'Products', href: '/products/' },
  { label: 'Services', href: '/services/' },
  { label: 'Industries', href: '/industries/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'Work', href: '/case-studies/' },
  { label: 'Education', href: '/education/' },
  { label: 'About', href: '/about/' },
];

export const FOOTER_COLUMNS = [
  {
    title: 'Products',
    links: [
      { label: 'AI Business Starter Pack', href: '/starter-pack/' },
      { label: 'Private AI', href: '/products/private-ai/' },
      { label: 'Chat AI Assistant', href: '/products/chat-ai-assistant/' },
      { label: 'Voice AI', href: '/products/voice-ai/' },
      { label: 'Felican IDP', href: '/products/felican-idp/' },
      { label: 'All products', href: '/products/' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Private AI systems', href: '/services/private-ai-systems/' },
      { label: 'AI auditing', href: '/services/ai-auditing/' },
      { label: 'AI cost reduction', href: '/services/ai-cost-analysis-and-reduction/' },
      { label: 'Workflow & Task Automation', href: '/services/workflow-and-task-automation/' },
      { label: 'All services', href: '/services/' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Private AI guide', href: '/guides/private-ai/' },
      { label: 'AI receptionist guide', href: '/guides/ai-receptionist/' },
      { label: 'AI governance guide', href: '/guides/ai-governance/' },
      { label: 'Comparisons', href: '/compare/' },
      { label: 'Books', href: '/books/' },
      { label: 'Education', href: '/education/' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about/' },
      { label: 'Client work', href: '/case-studies/' },
      { label: 'Industries we serve', href: '/industries/' },
      { label: 'Palm Beach County, FL', href: '/locations/palm-beach-county/' },
      { label: 'Contact', href: '/contact/' },
      { label: 'Book a call', href: '/booking/' },
    ],
  },
];

export const PALETTE = {
  ground: '#080E13',
  panel: '#101E24',
  panelAlt: '#0C1419',
  line: '#1C2A28',
  text: '#EEF4F4',
  body: '#C2D2D4',
  muted: '#8FA3A8',
  accent: '#2FB894',
  accentHi: '#59D4B4',
  accentSoft: '#8FE0C8',
};
