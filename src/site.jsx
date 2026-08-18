import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Bot, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  CircleCheck, Code2, GraduationCap, Mail, Menu, MessageCircle,
  Phone, Send, ShieldCheck, Sparkles, UserRound, Workflow, X,
} from 'lucide-react';
import './reboot.css';
import './variants.css';
import './cleanup.css';
import './claude-design.css';

const PHONE = '+1 (346) 515-0361';
const PHONE_HREF = 'tel:+13465150361';
const assetPath = fileName => `${import.meta.env.BASE_URL}${fileName}`;
const CALENDLY_URL = (() => {
  const candidate = (import.meta.env.VITE_CALENDLY_URL || '').trim();
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' && (parsed.hostname === 'calendly.com' || parsed.hostname.endsWith('.calendly.com'))
      ? parsed.toString()
      : '';
  } catch {
    return '';
  }
})();

const products = [
  { name: 'Felican Auto', path: '/products/felican-auto', category: 'Automotive', status: 'Available', description: 'Connected AI tools and workflows built for automotive businesses.', color: '#173f6b', features: ['Customer intake', 'Connected workflows', 'Follow-up and reporting'] },
  { name: 'World of Agents', path: '/products/world-of-agents', category: 'AI agents', status: 'Available', description: 'A place to discover and work with specialized AI agents built for focused tasks.', color: '#168b70', features: ['Specialized agents', 'Task-based discovery', 'Business workflows'] },
  { name: 'Relay', path: '/products/relay', category: 'Field service', status: 'Available', description: 'AI field-service software for HVAC, plumbing, and electrical companies.', color: '#2563eb', features: ['Maintenance scheduling', 'AP invoice automation', 'Collections, quotes, and crews'] },
  { name: 'Felican AI Assistant', path: '/products/felican-ai-assistant', category: 'Embeddable agent', status: 'Featured', description: 'A company-trained AI agent businesses can embed inside a website or app to answer questions, connect workflows, and hand off to people.', color: '#7357ff', features: ['Website and app embedding', 'Approved company knowledge', 'Workflow actions and human handoff'] },
];

const services = [
  { icon: Bot, title: 'AI agents and bots', text: 'Customer assistants and internal agents trained on your company knowledge and tools.' },
  { icon: Workflow, title: 'Business automation', text: 'Connected workflows for intake, documents, follow-up, reporting, and operations.' },
  { icon: Code2, title: 'Custom integrations', text: 'AI connected to your CRM, inbox, phone, calendar, databases, and business software.' },
  { icon: ShieldCheck, title: 'Private AI', text: 'Controlled deployments with defined access, approved knowledge, and governance.' },
  { icon: BriefcaseBusiness, title: 'AI implementation', text: 'Use-case selection, system design, delivery, rollout, and ongoing improvement.' },
  { icon: GraduationCap, title: 'Training', text: 'Practical workshops for leaders, operators, creators, and technical teams.' },
];

const books = [
  {
    title: "The Big Balla's Guide to Making Money with AI",
    subtitle: '100 Ways to Turn AI Into Income',
    status: 'New · 2026',
    image: assetPath('book-big-ballas.jpg'),
    description: 'One hundred ways to make money with AI, organized by startup cost and industry, with checklists and a business-launch playbook.',
  },
  {
    title: "Don't Be Replaced",
    subtitle: 'How Not to Lose Your Job to AI',
    status: 'On Amazon',
    image: assetPath('book-dont-be-replaced.jpg'),
    description: 'A working person’s plan for staying valuable by understanding job exposure and becoming the most AI-capable person on the team.',
  },
  {
    title: 'Stop Being Nice to AI',
    subtitle: 'How to Talk to AI Like a Pro with the GRRRRR Method',
    status: 'On Amazon',
    image: assetPath('book-stop-being-nice.jpg'),
    description: 'A practical guide to getting stronger results from AI using Lee Felican Jr.’s GRRRRR prompting method.',
  },
  {
    title: 'The BIG AI Book',
    subtitle: "A Children's Guide to AI (For Grown-Ups)",
    status: 'On Amazon',
    image: assetPath('book-big-ai.jpg'),
    description: 'A fully illustrated explanation of what AI is, where it appears in daily life, and how people can put it to work.',
  },
];

const BOOKS_URL = 'https://felican.ai/Lee-Felican-jr/books/resources/';

const faqs = [
  ['How can I contact Felican AI?', `Call us at ${PHONE} or email privateaiglobal@gmail.com. The Felican AI agent on this site is also available for quick product and service questions.`],
  ['Can Felican connect to our current software?', 'Yes. We design integrations around the systems your team already uses, including CRM, email, calendars, phone systems, documents, and databases.'],
  ['Is the assistant also a product?', 'Yes. Felican AI Assistant is an embeddable agent for websites and apps. We tailor it to a company’s knowledge, services, workflows, lead process, and escalation rules.'],
  ['Do you offer private AI and training?', 'Yes. We provide controlled AI deployments as well as practical training for teams that need to adopt AI responsibly and usefully.'],
];

function Mark({ onNavigate }) {
  return <a className="fs-mark" href="/" onClick={event => { if (onNavigate) { event.preventDefault(); onNavigate('/'); } }}><span>F</span><b>Felican AI</b></a>;
}

function Header({ onNavigate, path }) {
  const [open, setOpen] = useState(false);
  const go = href => event => { event.preventDefault(); setOpen(false); onNavigate(href); };
  return <header className="fs-header">
    <Mark onNavigate={onNavigate}/>
    <button className="fs-menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'open' : ''} aria-label="Main navigation">
      {[['/','Home'],['/products','Products'],['/services','Services'],['/books','Books'],['/about','About us'],['/contact','Contact'],['/booking','Book a Call']].map(([href,label]) => <a className={path === href || (href !== '/' && path.startsWith(`${href}/`)) ? `active${href === '/booking' ? ' contact-link' : ''}` : href === '/booking' ? 'contact-link' : ''} href={href} onClick={go(href)} key={href}>{label}</a>)}
    </nav>
  </header>;
}

function ReviewBar({ variant, setVariant }) {
  return <div className="review-bar"><span>Choose a direction</span>{[['signal','01 Editorial'],['catalog','02 Clean'],['network','03 Friendly']].map(([id,label]) => <button className={variant === id ? 'active' : ''} onClick={() => setVariant(id)} key={id}>{label}</button>)}</div>;
}

function Hero({ onNavigate }) {
  return <section className="fs-hero simple-hero" id="top">
    <div className="hero-copy">
      <span className="fs-kicker">Products, solutions, and training</span>
      <h1>We build useful AI for the way your business works.</h1>
      <p>Felican AI helps businesses turn everyday work into better systems—with practical products, custom AI, automation, integrations, and hands-on training.</p>
      <div className="hero-actions"><button className="fs-primary" onClick={() => onNavigate('/products')}>Explore products <ArrowRight/></button><button className="fs-secondary" onClick={() => onNavigate('/services')}>See our services</button></div>
      <div className="hero-index" aria-label="Felican AI at a glance">
        <span><b>Growing</b> Product lineup</span>
        <span><b>06</b> Services</span>
        <span><b>04</b> Books</span>
      </div>
    </div>
    <div className="hero-process" aria-label="How Felican AI works">
      <div className="hero-process-intro"><span>How we work</span><strong>From a real business need to a working solution.</strong></div>
      <ol>
        <li><b>01</b><span><strong>Understand the work</strong><small>Learn the people, process, and goal.</small></span></li>
        <li><b>02</b><span><strong>Build the right system</strong><small>Choose a product or create a custom solution.</small></span></li>
        <li><b>03</b><span><strong>Launch and improve</strong><small>Train the team and keep it working.</small></span></li>
      </ol>
    </div>
  </section>;
}

function WhatWeDo() {
  return <section className="what-we-do"><div><span className="fs-kicker">What we do</span><h2>AI that fits your business—not the other way around.</h2></div><div><p>We work with businesses in any industry. We learn how the work gets done, find where AI can make a real difference, and deliver useful products, custom systems, integrations, and training.</p><div className="what-we-do-links"><span>Products</span><span>Custom solutions</span><span>Team training</span></div></div></section>;
}

function ProductCard({ product, onNavigate, index }) {
  return <a className="product-card" href={product.path} onClick={event => { event.preventDefault(); onNavigate(product.path); }} aria-label={`Open ${product.name}`}>
    <div className="product-card-visual" style={{backgroundColor:product.color}}><b className="product-index">{String(index + 1).padStart(2, '0')}</b><span>{product.name.split(' ').map(word => word[0]).join('').slice(0, 3)}</span><small>{product.category}</small></div>
    <div className="product-card-body"><h3>{product.name}</h3><p>{product.description}</p><footer><span>Explore {product.name}</span><ArrowRight/></footer></div>
  </a>;
}

function Products({ onNavigate }) {
  return <section className="fs-products" id="products">
    <div className="section-heading"><span>Products</span><h2>Everything we make, in one place.</h2><p>Each product solves a specific business problem. Choose one to see what it does.</p></div>
    <div className="product-list all-products-grid">{products.map((product, index) => <ProductCard product={product} onNavigate={onNavigate} index={index} key={product.name}/>)}</div>
  </section>;
}

function ProductPage({ product, onNavigate }) {
  return <><PageIntro eyebrow={product.category} title={product.name} copy={product.description}/><section className="product-page"><div className="product-page-visual" style={{backgroundColor:product.color}}><span>{product.name.slice(0,2).toUpperCase()}</span><strong>{product.name}</strong></div><div><span className="fs-kicker">What it does</span><h2>Built for focused, practical work.</h2><p>{product.description}</p><div className="product-detail-features">{product.features.map(feature => <span key={feature}><CircleCheck/> {feature}</span>)}</div><button className="fs-primary" onClick={() => onNavigate('/contact')}>Contact us about {product.name} <ArrowRight/></button></div></section></>;
}

function WebsiteAssistantProduct({ onChat }) {
  return <section className="assistant-product">
    <div className="assistant-demo">
      <header><span className="online"/> Felican AI Assistant <small>Product demo</small></header>
      <div className="demo-chat"><p className="visitor">Can you help us automate customer follow-up?</p><p className="assistant"><Sparkles/>Yes. We can connect lead intake, your CRM, email, and human handoff into one managed workflow.</p></div>
      <button onClick={onChat}>Try the agent <ArrowRight/></button>
    </div>
    <div className="assistant-copy"><span className="fs-kicker">Felican AI product</span><h2>An AI agent that fits inside your website or app.</h2><p>Give customers useful answers based on approved company knowledge, connect actions to your workflows, collect context, and move the right conversations to a person.</p><ul><li><Check/>Website and app embedding</li><li><Check/>Custom company knowledge</li><li><Check/>Email, CRM, and workflow actions</li><li><Check/>Human escalation</li></ul><button className="fs-primary" onClick={onChat}>Open Felican AI <ArrowRight/></button></div>
  </section>;
}

function Services({ onNavigate }) {
  return <section className="fs-services" id="services"><div className="section-heading"><span>Services</span><h2>We design it, build it, and keep it working.</h2><p>Practical AI help for any business—from one workflow to a complete system.</p></div><div className="service-list">{services.map(service => <article key={service.title}><service.icon/><h3>{service.title}</h3><p>{service.text}</p></article>)}</div><div className="service-cta"><button className="fs-primary" onClick={() => onNavigate('/contact')}>Discuss a project <ArrowRight/></button></div></section>;
}

function SolutionsTraining({ onNavigate }) {
  return <section className="solutions-training" id="solutions">
    <article className="solutions-panel"><span>Solutions</span><h2>Start with the business problem.</h2><div className="solution-rows">{[['Customer response','Website and phone assistants'],['Operations','Workflow automation and agents'],['Knowledge','Private search and document intelligence'],['Sales','Lead intake, qualification, and follow-up'],['Management','Reporting and AI data insights']].map(([a,b]) => <div key={a}><b>{a}</b><span>{b}</span><ArrowRight/></div>)}</div></article>
    <article className="training-panel" id="training"><GraduationCap/><span>Training</span><h2>Help the team use AI well.</h2><p>Hands-on programs for leaders, operations teams, creators, and builders.</p><ul><li>AI fundamentals and responsible use</li><li>Prompting for daily work</li><li>Building agents and automations</li><li>Role-specific workflow workshops</li></ul><button onClick={() => onNavigate('/contact')}>Ask about training <ArrowRight/></button></article>
  </section>;
}

function Books() {
  return <section className="books-section" id="books"><div className="books-heading"><span className="fs-kicker">Books by Lee Felican Jr.</span><h2>Practical guides for working with AI.</h2><p>Four books about earning with AI, career readiness, better prompting, and AI fundamentals.</p><a className="fs-secondary" href={BOOKS_URL} target="_blank" rel="noreferrer"><BookOpen/> View all book resources</a></div><div className="books-grid">{books.map(book => <a className="book-card" href={BOOKS_URL} target="_blank" rel="noreferrer" key={book.title}><div className="book-cover"><img src={book.image} alt={`${book.title} cover`}/><span>{book.status}</span></div><div><small>{book.subtitle}</small><h3>{book.title}</h3><b>Open book resources <ArrowRight/></b></div></a>)}</div></section>;
}

function About() {
  return <section className="fs-about" id="about"><div><span>Company</span><h2>Built to make AI useful.</h2></div><div><p>Felican AI is a family-built technology company led by Lee Felican Jr. and Legend Felican. We build products and custom systems that solve real operational problems.</p><p>Our work includes AI assistants, business automation, private AI, software integrations, training, and ongoing optimization. The focus is simple: understand the work, build the right system, and support it after launch.</p><div className="about-principles"><span>Real workflows first</span><span>Clear data boundaries</span><span>Human handoff</span><span>Long-term support</span></div></div></section>;
}

function CompanyPreview({ onNavigate }) {
  return <section className="company-preview"><div><span className="fs-kicker">About Felican AI</span><h2>A family-built company focused on useful work.</h2></div><div><p>Lee Felican Jr. and Legend Felican build products and custom systems for businesses that want practical results—not more complexity.</p><button className="text-link" onClick={() => onNavigate('/about')}>Meet the company <ArrowRight/></button></div></section>;
}

function HomeContact({ onNavigate }) {
  return <section className="home-contact"><div><span>Have a project in mind?</span><h2>Let’s make the work easier.</h2></div><button onClick={() => onNavigate('/booking')}>Book a call <ArrowRight/></button></section>;
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return <section className="fs-faq"><div className="section-heading"><span>FAQ</span><h2>Common questions.</h2></div><div>{faqs.map(([q,a],i) => <article className={open === i ? 'open' : ''} key={q}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><ChevronDown/></button>{open === i && <p>{a}</p>}</article>)}</div></section>;
}

function Contact({ onChat }) {
  return <section className="fs-contact" id="contact"><div><span>Contact</span><h2>Tell us what needs to work better.</h2><p>Email us directly or call the company line.</p></div><div className="contact-actions"><a href="mailto:privateaiglobal@gmail.com"><Mail/><span><small>Send an email</small><b>privateaiglobal@gmail.com</b></span><ArrowRight/></a><a href={PHONE_HREF}><Phone/><span><small>Call Felican AI</small><b>{PHONE}</b></span><ArrowRight/></a><button onClick={onChat}><MessageCircle/><span><small>Quick questions</small><b>Ask Felican AI</b></span><ArrowRight/></button></div></section>;
}

function PageIntro({ eyebrow, title, copy }) {
  return <section className="page-intro" id="top"><span className="fs-kicker">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></section>;
}

function HomePage({ onNavigate }) {
  return <><Hero onNavigate={onNavigate}/><WhatWeDo/><Products onNavigate={onNavigate}/><Services onNavigate={onNavigate}/><Books/><CompanyPreview onNavigate={onNavigate}/><HomeContact onNavigate={onNavigate}/></>;
}

function ProductsPage({ onNavigate }) {
  return <><PageIntro eyebrow="Products" title="Products built for real work." copy="Every Felican AI product is listed together below. Select a product to open its page and learn what it does."/><Products onNavigate={onNavigate}/></>;
}

function ServicesPage({ onNavigate }) {
  return <><PageIntro eyebrow="Services" title="AI systems designed around your business." copy="From one focused automation to a connected AI system, we design, build, integrate, train, and support the work."/><Services onNavigate={onNavigate}/><SolutionsTraining onNavigate={onNavigate}/></>;
}

function BooksPage() {
  return <><PageIntro eyebrow="Books" title="Practical AI books by Lee Felican Jr." copy="Guides for earning with AI, staying valuable at work, prompting better, and understanding the technology."/><Books/></>;
}

function AboutPage() {
  return <><PageIntro eyebrow="About us" title="A family-built AI company." copy="Felican AI turns practical business problems into products, automations, assistants, and training people can actually use."/><About/><FAQ/></>;
}

function ContactPage({ onChat }) {
  return <><PageIntro eyebrow="Contact" title="Let’s talk about what needs to work better." copy="Email Felican AI directly or call the company line."/><Contact onChat={onChat}/><FAQ/></>;
}

function BookingPage() {
  return <>
    <section className="booking-hero" id="top">
      <div className="booking-copy">
        <span className="fs-kicker">Book a call</span>
        <h1>Let’s talk about where AI can create leverage.</h1>
        <p>Bring the business outcome, workflow, or AI decision in front of you. We’ll discuss what is practical, what needs control, and what a sensible next step could look like.</p>
        <div className="booking-points" aria-label="What the call covers">
          <span><Check/> Your goals and current workflow</span>
          <span><Check/> AI opportunity, risk, and cost</span>
          <span><Check/> A practical path forward</span>
        </div>
      </div>
      <aside className="booking-card" aria-label="Schedule with Felican AI">
        <CalendarDays aria-hidden="true"/>
        <span>INTRODUCTORY CALL</span>
        <h2>Choose a time that works for you.</h2>
        {CALENDLY_URL ? <>
          <a className="booking-primary" href={CALENDLY_URL} target="_blank" rel="noreferrer">Open Calendly <ArrowRight/></a>
          <iframe title="Book a call with Felican AI" src={`${CALENDLY_URL}?hide_gdpr_banner=1`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/>
        </> : <div className="booking-fallback" role="status">
          <strong>The calendar is being connected.</strong>
          <p>The booking page is ready. Until the Felican AI Calendly event link is added, call or email us directly.</p>
          <a href={PHONE_HREF}><Phone/> {PHONE}</a>
          <a href="mailto:privateaiglobal@gmail.com"><Mail/> privateaiglobal@gmail.com</a>
        </div>}
      </aside>
    </section>
    <section className="booking-trust"><span>Your AI partner</span><p>Felican AI brings evaluation, strategy, custom agents, workflow automation, governance, management, maintenance, and cost control together with a team of certified AI professionals.</p></section>
  </>;
}

function ChatPanel({ close }) {
  const [messages,setMessages] = useState([{role:'bot',text:'Hi. I’m the Felican AI agent. Ask me about our products, services, training, or company.'}]);
  const [input,setInput] = useState('');
  const respond = text => {
    const q = text.toLowerCase();
    if(q.includes('phone')||q.includes('call')||q.includes('contact')) return `Call Felican AI at ${PHONE}, or use the contact section to send an email.`;
    if(q.includes('product')) return 'Felican products include Felican Auto, World of Agents, Relay, the Felican AI Assistant, Private AI, document processing, and verification tools.';
    if(q.includes('train')) return 'Training includes AI fundamentals, prompting for daily work, workflow workshops, and hands-on agent building.';
    return 'Felican AI builds assistants, automations, integrations, private AI systems, and business software. Tell me what you want to improve and I’ll point you in the right direction.';
  };
  const send = text => { const clean=text.trim(); if(!clean)return; setMessages(m=>[...m,{role:'user',text:clean},{role:'bot',text:respond(clean)}]);setInput(''); };
  return <aside className="fs-chat" role="dialog" aria-label="Felican AI assistant"><header><div><span className="online"/><b>Felican AI Assistant</b><small>Embeddable agent demo</small></div><button onClick={close}><X/></button></header><div className="fs-chat-messages">{messages.map((m,i)=><p className={m.role} key={i}>{m.text}</p>)}</div><div className="quick-asks">{['What products do you have?','Tell me about training','How do I contact Felican AI?'].map(q=><button key={q} onClick={()=>send(q)}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();send(input)}}><input aria-label="Message Felican AI" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question"/><button><Send/></button></form></aside>;
}

export function FelicanSite() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('v');
  const [variant,setVariant] = useState(['signal','catalog','network'].includes(requested) ? requested : 'signal');
  const review = params.get('review') === '1';
  const [chat,setChat] = useState(false);
  const publicPaths = ['/products','/services','/books','/about','/contact','/booking', ...products.map(product => product.path)];
  const normalizePath = value => publicPaths.includes(value) ? value : '/';
  const [path,setPath] = useState(normalizePath(window.location.pathname));
  useEffect(() => {
    const handleBack = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);
  const navigate = nextPath => {
    const next = normalizePath(nextPath);
    if (next !== path) window.history.pushState({}, '', `${next}${window.location.search}`);
    setPath(next);
    if (!window.navigator.userAgent.toLowerCase().includes('jsdom')) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const selectedProduct = products.find(product => product.path === path);
  const page = selectedProduct ? <ProductPage product={selectedProduct} onNavigate={navigate}/> : {
    '/': <HomePage onNavigate={navigate}/>,
    '/products': <ProductsPage onNavigate={navigate}/>,
    '/services': <ServicesPage onNavigate={navigate}/>,
    '/books': <BooksPage/>,
    '/about': <AboutPage/>,
    '/contact': <ContactPage onChat={() => setChat(true)}/>,
    '/booking': <BookingPage/>,
  }[path];
  return <div className={`felican-site variant-${variant}`}>
    {review && <ReviewBar variant={variant} setVariant={setVariant}/>}<Header path={path} onNavigate={navigate}/><main key={path}>{page}</main><footer className="fs-footer"><Mark onNavigate={navigate}/><nav aria-label="Footer navigation">{[['/','Home'],['/products','Products'],['/services','Services'],['/books','Books'],['/about','About'],['/contact','Contact'],['/booking','Book a Call']].map(([href,label]) => <a href={href} onClick={event => { event.preventDefault(); navigate(href); }} key={href}>{label}</a>)}</nav><span>© 2026 Felican AI</span></footer>{chat && <ChatPanel close={()=>setChat(false)}/>}</div>;
}
