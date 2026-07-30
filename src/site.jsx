import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Bot, BriefcaseBusiness, Check, ChevronDown,
  CircleCheck, Code2, GraduationCap, Mail, Menu, MessageCircle,
  Phone, Send, ShieldCheck, Sparkles, UserRound, Workflow, X,
} from 'lucide-react';
import './reboot.css';
import './variants.css';
import './cleanup.css';
import './cleanup.css';

const PHONE = '+1 (346) 515-0361';
const PHONE_HREF = 'tel:+13465150361';

const products = [
  { name: 'Relay', group: 'Business systems', category: 'Field service', status: 'Live', description: 'Field-service software for HVAC, plumbing, and electrical companies.', color: '#2467f2', href: 'https://felican.ai/relay', image: '/relay-live.png' },
  { name: 'CasaSuite', group: 'Business systems', category: 'Real estate', status: 'Live', description: 'AI tools for real-estate agents, investors, and property teams.', color: '#e76a32', href: 'https://felican.ai/realestate', image: '/casasuite-live.png' },
  { name: 'Felican Auto', group: 'Business systems', category: 'Automotive', status: 'Available', description: 'Connected AI tools and workflows built for automotive businesses.', color: '#173f6b' },
  { name: 'Felican AI Assistant', group: 'AI products', category: 'Customer experience', status: 'Featured', description: 'A company-trained website assistant that answers questions, recommends services, and captures inquiries.', color: '#7357ff' },
  { name: 'World of Agents', group: 'AI products', category: 'AI agents', status: 'Available', description: 'A place to discover and work with specialized AI agents built for focused tasks.', color: '#168b70' },
  { name: 'BookMaker', group: 'AI products', category: 'Publishing', status: 'Available', description: 'An AI workspace for planning, writing, organizing, and preparing books.', color: '#9b4f2f' },
  { name: 'Marketer', group: 'AI products', category: 'Marketing', status: 'Available', description: 'An AI marketing workspace for campaigns, content, and brand execution.', color: '#bd3f67' },
];

const productGroups = [
  {
    name: 'Business systems',
    label: 'Run the business',
    description: 'Purpose-built software for teams with real customers, real work, and real operations.',
  },
  {
    name: 'AI products',
    label: 'Create and automate',
    description: 'Focused AI products for customer support, agents, publishing, and marketing.',
  },
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
    image: '/book-big-ballas.jpg',
    description: 'One hundred ways to make money with AI, organized by startup cost and industry, with checklists and a business-launch playbook.',
  },
  {
    title: "Don't Be Replaced",
    subtitle: 'How Not to Lose Your Job to AI',
    status: 'On Amazon',
    image: '/book-dont-be-replaced.jpg',
    description: 'A working person’s plan for staying valuable by understanding job exposure and becoming the most AI-capable person on the team.',
  },
  {
    title: 'Stop Being Nice to AI',
    subtitle: 'How to Talk to AI Like a Pro with the GRRRRR Method',
    status: 'On Amazon',
    image: '/book-stop-being-nice.jpg',
    description: 'A practical guide to getting stronger results from AI using Lee Felican Jr.’s GRRRRR prompting method.',
  },
  {
    title: 'The BIG AI Book',
    subtitle: "A Children's Guide to AI (For Grown-Ups)",
    status: 'On Amazon',
    image: '/book-big-ai.jpg',
    description: 'A fully illustrated explanation of what AI is, where it appears in daily life, and how people can put it to work.',
  },
];

const BOOKS_URL = 'https://felican.ai/Lee-Felican-jr/books/resources/';

const faqs = [
  ['How can I contact Felican AI?', `Call us at ${PHONE}, email the company, or use the website assistant. The contact section has all three options.`],
  ['Can Felican connect to our current software?', 'Yes. We design integrations around the systems your team already uses, including CRM, email, calendars, phone systems, documents, and databases.'],
  ['Is the website assistant also a product?', 'Yes. The assistant on this site represents a product Felican AI can tailor to another company’s knowledge, services, lead process, and escalation rules.'],
  ['Do you offer private AI and training?', 'Yes. We provide controlled AI deployments as well as practical training for teams that need to adopt AI responsibly and usefully.'],
];

function Mark() {
  return <a className="fs-mark" href="#top"><span>F</span><b>Felican AI</b></a>;
}

function Header({ onChat }) {
  const [open, setOpen] = useState(false);
  return <header className="fs-header">
    <Mark />
    <button className="fs-menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'open' : ''}>
      <a href="#products">Products</a><a href="#services">Services</a><a href="#solutions">Solutions</a><a href="#training">Training</a><a href="#books">Books</a><a href="#about">Company</a>
      <a className="fs-phone-link" href={PHONE_HREF}><Phone/> {PHONE}</a>
      <button className="fs-primary fs-nav-cta" onClick={onChat}>Ask Felican AI</button>
    </nav>
  </header>;
}

function ReviewBar({ variant, setVariant }) {
  return <div className="review-bar"><span>Design review</span>{[['signal','01 Signal'],['catalog','02 Catalog'],['network','03 Network']].map(([id,label]) => <button className={variant === id ? 'active' : ''} onClick={() => setVariant(id)} key={id}>{label}</button>)}</div>;
}

function ProductShowcase() {
  return <div className="hero-showcase">
    <div className="showcase-window"><header><span><i/><i/><i/></span><b>Relay</b><small>Felican AI product</small></header><img src="/relay-live.png" alt="Relay field service software"/></div>
    <div className="showcase-stat"><strong>{products.length}</strong><span>focused products across business software, publishing, marketing, and AI.</span></div>
    <div className="showcase-mini"><span className="product-symbol" style={{background:'#e76a32'}}>CS</span><div><b>CasaSuite</b><small>Real estate operations</small></div><ArrowRight/></div>
  </div>;
}

function Hero({ onChat, variant }) {
  const copy = {
    signal: ['Products · Services · Training', 'Practical AI for the work that runs your business.', 'Felican AI builds software, assistants, and automations for companies that want useful systems, clear support, and measurable improvements.'],
    catalog: ['The Felican AI catalogue', 'Products and services, built by Felican AI.', 'Explore our software portfolio, custom implementation services, training programs, and publishing work.'],
    network: ['Connected AI systems', 'Connect your business to working AI.', 'We connect company knowledge, software, people, and AI into systems that can answer, act, and hand work to the right person.'],
  }[variant];
  return <section className="fs-hero" id="top">
    <div className="hero-copy">
      <span className="fs-kicker">{copy[0]}</span>
      <h1>{copy[1]}</h1>
      <p>{copy[2]}</p>
      <div className="hero-actions"><button className="fs-primary" onClick={onChat}>Talk to Felican AI <ArrowRight/></button><a className="fs-secondary" href={PHONE_HREF}><Phone/> Call {PHONE}</a></div>
      <div className="hero-proof"><span><Check/> Real products</span><span><Check/> Custom systems</span><span><Check/> Hands-on training</span></div>
    </div>
    <ProductShowcase/>
    <div className="hero-grid-labels" aria-hidden="true"><span>BUILD</span><span>CONNECT</span><span>TRAIN</span></div>
  </section>;
}

function ProductCard({ product, featured = false }) {
  const content = <>
    {product.image && <div className="product-shot"><img src={product.image} alt={`${product.name} product interface`}/></div>}
    {!product.image && featured && <div className="product-shot product-placeholder" style={{background:product.color}}><span>{product.name}</span><small>{product.category}</small></div>}
    <div className="product-card-body"><header><span className="product-symbol" style={{background:product.color}}>{product.name.slice(0,2).toUpperCase()}</span><small>{product.status}</small></header><h3>{product.name}</h3><p>{product.description}</p><footer><span>{product.category}</span>{product.href ? <ArrowRight/> : <small>Felican AI</small>}</footer></div>
  </>;
  return product.href ? <a className={featured ? 'product-card featured' : 'product-card'} href={product.href} target="_blank" rel="noreferrer">{content}</a> : <article className={featured ? 'product-card featured' : 'product-card'}>{content}</article>;
}

function Products() {
  return <section className="fs-products" id="products">
    <div className="section-heading"><span>Products</span><h2>Built by Felican AI.</h2><p>A focused portfolio of business systems and practical AI products—organized by what they help you do.</p></div>
    <div className="product-groups">{productGroups.map(group => <section className="product-group" key={group.name}>
      <div className="product-group-heading"><div><small>{group.label}</small><h3>{group.name}</h3></div><p>{group.description}</p></div>
      <div className="product-list">{products.filter(product => product.group === group.name).map(product => <ProductCard product={product} featured={group.name === 'Business systems'} key={product.name}/>)}</div>
    </section>)}</div>
  </section>;
}

function WebsiteAssistantProduct({ onChat }) {
  return <section className="assistant-product">
    <div className="assistant-demo">
      <header><span className="online"/> Felican AI Assistant <small>Product demo</small></header>
      <div className="demo-chat"><p className="visitor">Can you help us automate customer follow-up?</p><p className="assistant"><Sparkles/>Yes. We can connect lead intake, your CRM, email, and human handoff into one managed workflow.</p></div>
      <button onClick={onChat}>Try the website assistant <ArrowRight/></button>
    </div>
    <div className="assistant-copy"><span className="fs-kicker">Felican AI product</span><h2>A website assistant that knows the business.</h2><p>Give visitors useful answers based on approved company knowledge. Recommend the right service, collect context, and move qualified inquiries to a person.</p><ul><li><Check/>Custom company knowledge</li><li><Check/>Lead qualification and capture</li><li><Check/>Email and CRM workflows</li><li><Check/>Human escalation</li></ul><button className="fs-primary" onClick={onChat}>Open Felican AI <ArrowRight/></button></div>
  </section>;
}

function Services() {
  return <section className="fs-services" id="services"><div className="section-heading"><span>Services</span><h2>We design it, build it, and keep it working.</h2></div><div className="service-list">{services.map((service,i) => <article key={service.title}><small>{String(i+1).padStart(2,'0')}</small><service.icon/><h3>{service.title}</h3><p>{service.text}</p><a href="#contact">Discuss a project <ArrowRight/></a></article>)}</div></section>;
}

function SolutionsTraining() {
  return <section className="solutions-training" id="solutions">
    <article className="solutions-panel"><span>Solutions</span><h2>Start with the business problem.</h2><div className="solution-rows">{[['Customer response','Website and phone assistants'],['Operations','Workflow automation and agents'],['Knowledge','Private search and document intelligence'],['Sales','Lead intake, qualification, and follow-up'],['Management','Reporting and AI data insights']].map(([a,b]) => <div key={a}><b>{a}</b><span>{b}</span><ArrowRight/></div>)}</div></article>
    <article className="training-panel" id="training"><GraduationCap/><span>Training</span><h2>Help the team use AI well.</h2><p>Hands-on programs for leaders, operations teams, creators, and builders.</p><ul><li>AI fundamentals and responsible use</li><li>Prompting for daily work</li><li>Building agents and automations</li><li>Role-specific workflow workshops</li></ul><button>View training options <ArrowRight/></button></article>
  </section>;
}

function Books() {
  return <section className="books-section" id="books"><div className="books-heading"><span className="fs-kicker">Books by Lee Felican Jr.</span><h2>Practical guides for working with AI.</h2><p>Four books covering AI income opportunities, career readiness, better prompting, and AI fundamentals.</p><a className="fs-secondary" href={BOOKS_URL} target="_blank" rel="noreferrer"><BookOpen/> Open the official book resources</a></div><div className="books-grid">{books.map(book => <a className="book-card" href={BOOKS_URL} target="_blank" rel="noreferrer" key={book.title}><div className="book-cover"><img src={book.image} alt={`${book.title} cover`}/><span>{book.status}</span></div><div><small>{book.subtitle}</small><h3>{book.title}</h3><p>{book.description}</p><b>View book resources <ArrowRight/></b></div></a>)}</div></section>;
}

function About() {
  return <section className="fs-about" id="about"><div><span>Company</span><h2>Built to make AI useful.</h2></div><div><p>Felican AI is a family-built technology company led by Lee Felican Jr. and Legend Felican. We build products and custom systems that solve real operational problems.</p><p>Our work includes AI assistants, business automation, private AI, software integrations, training, and ongoing optimization. The focus is simple: understand the work, build the right system, and support it after launch.</p><div className="about-principles"><span>Real workflows first</span><span>Clear data boundaries</span><span>Human handoff</span><span>Long-term support</span></div></div></section>;
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return <section className="fs-faq"><div className="section-heading"><span>FAQ</span><h2>Common questions.</h2></div><div>{faqs.map(([q,a],i) => <article className={open === i ? 'open' : ''} key={q}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><ChevronDown/></button>{open === i && <p>{a}</p>}</article>)}</div></section>;
}

function Contact({ onChat }) {
  return <section className="fs-contact" id="contact"><div><span>Contact</span><h2>Tell us what needs to work better.</h2><p>Call, email, or start with the website assistant.</p></div><div className="contact-actions"><a href={PHONE_HREF}><Phone/><span><small>Call Felican AI</small><b>{PHONE}</b></span><ArrowRight/></a><button onClick={onChat}><MessageCircle/><span><small>Chat on the website</small><b>Ask Felican AI</b></span><ArrowRight/></button><a href="mailto:info@privateaiglobal.com"><Mail/><span><small>Send an email</small><b>info@privateaiglobal.com</b></span><ArrowRight/></a></div></section>;
}

function ChatPanel({ close }) {
  const [messages,setMessages] = useState([{role:'bot',text:'Hi. I’m the Felican AI website assistant. Ask me about our products, services, training, or company.'}]);
  const [input,setInput] = useState('');
  const respond = text => {
    const q = text.toLowerCase();
    if(q.includes('phone')||q.includes('call')||q.includes('contact')) return `Call Felican AI at ${PHONE}, or use the contact section to send an email.`;
    if(q.includes('product')) return 'Felican products include Relay, CasaSuite, Felican Auto, the Felican AI Assistant, World of Agents, BookMaker, and Marketer.';
    if(q.includes('train')) return 'Training includes AI fundamentals, prompting for daily work, workflow workshops, and hands-on agent building.';
    return 'Felican AI builds assistants, automations, integrations, private AI systems, and business software. Tell me what you want to improve and I’ll point you in the right direction.';
  };
  const send = text => { const clean=text.trim(); if(!clean)return; setMessages(m=>[...m,{role:'user',text:clean},{role:'bot',text:respond(clean)}]);setInput(''); };
  return <aside className="fs-chat" role="dialog" aria-label="Felican AI website assistant"><header><div><span className="online"/><b>Felican AI Assistant</b><small>Website product demo</small></div><button onClick={close}><X/></button></header><div className="fs-chat-messages">{messages.map((m,i)=><p className={m.role} key={i}>{m.text}</p>)}</div><div className="quick-asks">{['What products do you have?','Tell me about training','How do I contact Felican AI?'].map(q=><button key={q} onClick={()=>send(q)}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();send(input)}}><input aria-label="Message Felican AI" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question"/><button><Send/></button></form></aside>;
}

export function FelicanSite() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('v');
  const [variant,setVariant] = useState(['signal','catalog','network'].includes(requested) ? requested : 'signal');
  const review = params.get('review') === '1';
  const [chat,setChat] = useState(false);
  return <div className={`felican-site variant-${variant}`}>
    {review && <ReviewBar variant={variant} setVariant={setVariant}/>}<Header onChat={()=>setChat(true)}/><main><Hero variant={variant} onChat={()=>setChat(true)}/><Products/><WebsiteAssistantProduct onChat={()=>setChat(true)}/><Services/><SolutionsTraining/><Books/><About/><FAQ/><Contact onChat={()=>setChat(true)}/></main><footer className="fs-footer"><Mark/><p>Products · Services · Solutions · Training · Books · Company · Contact</p><span>© 2026 Felican AI</span></footer>{chat && <ChatPanel close={()=>setChat(false)}/>}</div>;
}
