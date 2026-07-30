import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Bot, BookOpen, BrainCircuit, Check, ChevronDown,
  CirclePlay, Clock3, Code2, Compass, Headphones, LockKeyhole,
  Menu, MessageCircle, Mic2, Phone, Play, RotateCcw, Send,
  Sparkles, Workflow, X, Zap,
} from 'lucide-react';
import './styles.css';
import './corrections.css';
import './human.css';
import { FelicanSite } from './site.jsx';

const PHONE_DISPLAY = '+1 (346) 515-0361';
const PHONE_LINK = 'tel:+13465150361';

const products = [
  { name: 'Felican AI Assistant', mark: 'FA', category: 'AI workspace', tone: 'coral', description: 'The always-on guide to Felican products, services, training, and support—on the web and by phone.', status: 'Flagship' },
  { name: 'Relay', mark: 'RL', category: 'Business ops', tone: 'sage', description: 'AI field-service software for HVAC, plumbing, and electrical teams—from scheduling to collections.', status: 'Live' },
  { name: 'CasaSuite', mark: 'CS', category: 'Business ops', tone: 'gold', description: 'A practical AI operating system for real-estate professionals, investors, and property teams.', status: 'Live' },
  { name: 'LeadConcierge AI', mark: 'LC', category: 'Business ops', tone: 'blue', description: 'Capture, score, and respond to real-estate leads with intelligent intake and instant follow-up.', status: 'Live' },
  { name: 'InvestorHQ', mark: 'IH', category: 'Business ops', tone: 'green', description: 'Analyze deals, manage a pipeline, and oversee rental operations from one intelligent workspace.', status: 'Live' },
  { name: 'Ora', mark: 'OR', category: 'AI workspace', tone: 'violet', description: 'Think with leading AI models from one refined chat workspace—without juggling five different apps.', status: 'Preview' },
  { name: 'ThreadPilot', mark: 'TP', category: 'Business ops', tone: 'teal', description: 'An AI email chief of staff that triages threads, summarizes conversations, and drafts replies.', status: 'Preview' },
  { name: 'AdPulse', mark: 'AP', category: 'Business ops', tone: 'red', description: 'Turn ad-account exports into an instant health score and a prioritized list of fixes.', status: 'Preview' },
  { name: 'FrameFire', mark: 'FF', category: 'Creative tools', tone: 'orange', description: 'Turn a one-line brief into a polished vertical video with editable motion templates.', status: 'Preview' },
  { name: 'Lumina', mark: 'LU', category: 'Creative tools', tone: 'rose', description: 'A clear, approachable AI image studio for turning ideas into finished visual concepts.', status: 'Preview' },
  { name: 'Dendrite', mark: 'DE', category: 'Developer tools', tone: 'lime', description: 'A web-extraction API that turns complex pages into clean, token-efficient, AI-ready content.', status: 'Preview' },
  { name: 'Quorum', mark: 'QU', category: 'AI workspace', tone: 'navy', description: 'Four specialist agents debate an investment idea and produce structured research and risk analysis.', status: 'Research' },
];

const services = [
  { icon: Bot, name: 'AI agents & bots', description: 'Customer-facing assistants and internal agents that know your business, use your tools, and hand off cleanly.' },
  { icon: Workflow, name: 'Business automation', description: 'Remove repetitive work across lead intake, follow-up, reporting, documents, operations, and support.' },
  { icon: Code2, name: 'Custom integrations', description: 'Connect AI with your CRM, inbox, phone system, databases, forms, calendars, and line-of-business apps.' },
  { icon: LockKeyhole, name: 'Private AI systems', description: 'Deploy AI in a controlled environment with clear access, governance, and data-handling boundaries.' },
  { icon: BrainCircuit, name: 'AI strategy & implementation', description: 'Find the highest-value use cases, design the right system, ship it, and improve it with your team.' },
  { icon: Headphones, name: 'Managed optimization', description: 'Ongoing monitoring, prompt refinement, workflow tuning, model updates, and practical support.' },
];

const faqs = [
  ['Can Felican AI work with our existing software?', 'Yes. Custom integrations are a core service. We design around the systems your team already uses—CRM, email, calendars, phone, documents, databases, and specialized tools.'],
  ['What happens when I call Felican AI?', 'Our AI front desk answers first. It knows Felican AI, our products, services, training, and common questions. It can understand why you are calling, transfer you to Legend or Lee when appropriate, collect details, and send the right follow-up email.'],
  ['Do you offer private AI deployment?', 'Yes. Felican can design controlled AI deployments for organizations that need stronger data boundaries, access control, auditability, and governance.'],
  ['Do you train teams as well as build systems?', 'Yes. Training ranges from practical AI foundations and prompt skills to hands-on agent and automation workshops for specific teams.'],
];

function Logo({ compact = false }) {
  return <a className="brand" href="#top" aria-label="Felican AI home"><span className="brand-mark">F</span>{!compact && <span>Felican <i>AI</i></span>}</a>;
}

function Nav({ onCall, onChat, compact = false }) {
  const [open, setOpen] = useState(false);
  return <header className="site-nav">
    <Logo compact={compact} />
    <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
      <a href="#products">Products</a><a href="#services">Services</a><a href="#training">Training</a><a href="#about">About</a>
      <button className="text-button" onClick={onCall}><Phone size={15}/> {PHONE_DISPLAY}</button>
      <button className="button button-small" onClick={onChat}>Ask Felican AI</button>
    </nav>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
  </header>;
}

function DesignSwitcher({ design, setDesign }) {
  return <aside className="design-switcher" aria-label="Choose a design concept">
    <span>Claude directions</span>
    {[
      ['broadsheet', '01', 'Broadsheet'], ['workbench', '02', 'Workbench'], ['conversation', '03', 'Conversation'],
    ].map(([id, num, label]) => <button key={id} className={design === id ? 'active' : ''} onClick={() => { setDesign(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><b>{num}</b><em>{label}</em></button>)}
  </aside>;
}

function PhoneDemo({ onClose }) {
  const [playing, setPlaying] = useState(false);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="phone-modal" role="dialog" aria-modal="true" aria-labelledby="phone-title" onMouseDown={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close phone demo"><X/></button>
      <div className="phone-orb"><Phone/></div>
      <p className="eyebrow">Our AI-powered front desk</p>
      <h2 id="phone-title">Call Felican AI. Our AI answers first.</h2>
      <p>It knows our company, products, services, training, and common business questions. It can understand what you need, transfer you to Legend or Lee, collect a message, and send email summaries or follow-ups.</p>
      <div className={playing ? 'call-transcript playing' : 'call-transcript'}>
        <p><b>Caller</b> “Can you build an AI agent for our service team?”</p>
        <p><b>Felican AI</b> “Yes. We build agents around your company knowledge and tools. I can transfer you to Legend, connect you with Lee, or email you an overview—which would you prefer?”</p>
      </div>
      <div className="call-outcomes"><span><Phone/> Transfer the caller</span><span><Send/> Email the details</span><span><MessageCircle/> Take a message</span></div>
      <div className="modal-actions">
        <button className="button button-outline" onClick={() => setPlaying(!playing)}>{playing ? <RotateCcw/> : <Play/>}{playing ? 'Replay demo' : 'Hear how it works'}</button>
        <a className="button" href={PHONE_LINK}><Phone/> Call {PHONE_DISPLAY}</a>
      </div>
      <small>Website prototype: the production voice agent will need the Felican knowledge base, transfer rules and availability for Legend and Lee, email templates, call logging, and human fallback configured before launch.</small>
    </section>
  </div>;
}

function ChatAssistant({ onClose }) {
  const starter = { role: 'bot', text: 'Hi, I’m Felican AI. Ask me about our products, AI agents, automation, private AI, or training.' };
  const [messages, setMessages] = useState([starter]);
  const [value, setValue] = useState('');
  const answer = (input) => {
    const q = input.toLowerCase();
    if (q.includes('phone') || q.includes('call')) return `Call us at ${PHONE_DISPLAY}. Our AI front desk answers questions about Felican AI, understands why you are calling, and can transfer you to Legend or Lee, take a message, or send an email follow-up.`;
    if (q.includes('train') || q.includes('workshop')) return 'We offer AI foundations, practical team workshops, prompt training, and hands-on agent and automation programs.';
    if (q.includes('private') || q.includes('secure')) return 'Felican designs controlled AI environments with clear access, governance, and data-handling boundaries.';
    if (q.includes('product')) return `Our current portfolio includes ${products.slice(0, 6).map(p => p.name).join(', ')}, and more. I can help narrow it down.`;
    if (q.includes('agent') || q.includes('bot') || q.includes('automation') || q.includes('build')) return 'We build agents and automations around real workflows—intake, customer support, reporting, follow-up, documents, and internal operations.';
    return 'That sounds like a good discovery conversation. Tell me the repetitive task, customer moment, or decision you want AI to improve, and I’ll point you to the right Felican service.';
  };
  const submit = (text = value) => {
    const clean = text.trim(); if (!clean) return;
    setMessages(old => [...old, { role: 'user', text: clean }, { role: 'bot', text: answer(clean) }]); setValue('');
  };
  return <section className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
    <header><div><span className="online-dot"/><div><h2 id="chat-title">Felican AI</h2><small>Online · company guide</small></div></div><button onClick={onClose} aria-label="Close chat"><X/></button></header>
    <div className="chat-messages">{messages.map((m, i) => <p className={m.role} key={i}>{m.text}</p>)}</div>
    <div className="chat-chips">{['What do you build?', 'Tell me about training', 'What is private AI?'].map(q => <button key={q} onClick={() => submit(q)}>{q}</button>)}</div>
    <form onSubmit={e => { e.preventDefault(); submit(); }}><input aria-label="Ask Felican AI" value={value} onChange={e => setValue(e.target.value)} placeholder="Ask about Felican AI…"/><button aria-label="Send message"><Send/></button></form>
  </section>;
}

function FloatingChat({ onClick }) { return <button className="floating-chat" onClick={onClick}><Sparkles/><span>Ask Felican AI</span></button>; }

function ProductMark({ product }) { return <span className={`product-mark ${product.tone}`}>{product.mark}</span>; }

function ProductIndex({ limit }) {
  const shown = limit ? products.slice(0, limit) : products;
  return <div className="product-index">{shown.map((p, i) => <article key={p.name}><span className="index-number">{String(i + 1).padStart(2, '0')}</span><ProductMark product={p}/><div><h3>{p.name}</h3><p>{p.description}</p></div><span className="status">{p.status}</span><ArrowRight/></article>)}</div>;
}

function TrainingBooks() {
  return <section className="learning-split" id="training">
    <article className="training-card"><span className="section-icon"><Compass/></span><p className="eyebrow">Training</p><h2>Build capability inside your team.</h2><p>Practical programs for leaders, operators, creators, and technical teams—from AI fundamentals to building agents and automations.</p><ul><li><Check/> AI foundations & prompt fluency</li><li><Check/> Role-specific workflow labs</li><li><Check/> Agent & automation builder sessions</li></ul><button className="arrow-link">Explore training <ArrowRight/></button></article>
    <article className="books-card"><span className="section-icon"><BookOpen/></span><p className="eyebrow">Books & playbooks</p><h2>The library is being catalogued.</h2><p>This concept includes a dedicated publishing shelf. Add the confirmed Felican book titles, covers, descriptions, and purchase links here before launch.</p><div className="book-spines" aria-hidden="true"><i/><i/><i/><i/></div><button className="arrow-link">Get release notes <ArrowRight/></button></article>
  </section>;
}

function AboutBand() {
  return <section className="about-band" id="about"><div><p className="eyebrow">About Felican AI</p><h2>AI should fit the business—not the other way around.</h2></div><div><p>Felican AI helps organizations use generative AI without giving up control, clarity, or the human judgment that makes a business worth trusting.</p><p>We combine product building, custom implementation, private AI options, training, and ongoing optimization. The goal is practical: ship useful systems that solve real work and keep improving after launch.</p><div className="values"><span>Built around real workflows</span><span>Clear data boundaries</span><span>Business-ready outcomes</span><span>Long-term partnership</span></div></div></section>;
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return <section className="faq-section"><p className="eyebrow">A few useful answers</p><h2>Questions before we start.</h2><div>{faqs.map(([q,a], i) => <article className={open === i ? 'open' : ''} key={q}><button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{q}</span><ChevronDown/></button>{open === i && <p>{a}</p>}</article>)}</div></section>;
}

function Footer({ onCall, onChat }) {
  return <footer><div className="footer-cta"><p className="eyebrow">Start a useful conversation</p><h2>What should AI take off your plate?</h2><div><button className="button" onClick={onChat}>Ask Felican AI <ArrowRight/></button><button className="button button-outline" onClick={onCall}><Phone/> Call {PHONE_DISPLAY}</button></div></div><div className="footer-bottom"><Logo/><p>Products · Services · Solutions · Training · Books · About · Contact</p><p>© 2026 Felican AI</p></div></footer>;
}

function Broadsheet({ onCall, onChat }) {
  return <div className="concept broadsheet" id="top"><Nav onCall={onCall} onChat={onChat}/><main>
    <section className="b-hero"><aside><span>Felican AI</span><span>Applied technology</span></aside><div><p className="eyebrow">Products and services</p><h1>AI products and automation for growing businesses.</h1><div className="hero-foot"><p>We build software for service companies, real estate teams, and operators with work that should be faster.</p><div><button className="button" onClick={onChat}>Talk to Felican AI <ArrowRight/></button><button className="arrow-link" onClick={onCall}><Phone/> Call our office</button></div></div></div></section>
    <section className="editorial-callout"><span>01 / Our front desk</span><div><p className="quote">“Thanks for calling Felican AI. I can answer questions, take a message, send information by email, or connect you with Legend or Lee.”</p><button className="arrow-link" onClick={onCall}>Call our AI · {PHONE_DISPLAY} <ArrowRight/></button></div><div className="waveform">{Array.from({length:28}).map((_,i)=><i style={{height:`${18 + (i*17)%46}px`}} key={i}/>)}</div></section>
    <section className="indexed-section" id="products"><header><p className="eyebrow">02 / Products</p><h2>Things we have built.</h2><p>A growing portfolio of practical AI software for operators, teams, creators, and decision-makers.</p></header><ProductIndex/></section>
    <section className="service-table" id="services"><header><p className="eyebrow">03 / Services</p><h2>From idea to working system.</h2></header><div>{services.map((s,i)=><article key={s.name}><span>{String(i+1).padStart(2,'0')}</span><s.icon/><h3>{s.name}</h3><p>{s.description}</p><ArrowRight/></article>)}</div></section>
    <TrainingBooks/><AboutBand/><FAQ/>
  </main><Footer onCall={onCall} onChat={onChat}/><FloatingChat onClick={onChat}/></div>;
}

function PhoneWidget({ onCall }) {
  return <div className="live-phone-widget contact-card"><header><span>When you call Felican AI</span><span>{PHONE_DISPLAY}</span></header><h2>Our AI receptionist answers first.</h2><ul><li><Check/>Answers questions about the company</li><li><Check/>Explains products, services, and training</li><li><Check/>Transfers callers to Legend or Lee</li><li><Check/>Sends messages and email follow-ups</li></ul><button className="text-button" onClick={onCall}><Phone/> See the call flow <ArrowRight/></button></div>;
}

function Workbench({ onCall, onChat }) {
  const [filter, setFilter] = useState('All');
  const filtered = useMemo(() => filter === 'All' ? products : products.filter(p=>p.category===filter), [filter]);
  return <div className="concept workbench" id="top"><Nav onCall={onCall} onChat={onChat}/><main>
    <section className="w-hero"><div><span className="mono-label">FELICAN AI</span><h1>AI systems for real business work.</h1><p>We build and maintain software for service companies, real estate teams, and growing businesses.</p><div><button className="button" onClick={onChat}>Ask about our work <ArrowRight/></button><button className="button button-outline" onClick={onCall}><Phone/> Call {PHONE_DISPLAY}</button></div><small>Products, implementation, and team training</small></div><PhoneWidget onCall={onCall}/></section>
    <section className="demo-shelf"><article onClick={onCall}><div className="tile-top"><Phone/><span className="mono-label">COMPANY CONTACT</span></div><h2>Call Felican AI</h2><p>Our AI answers the company line, helps the caller, transfers to Legend or Lee, and sends the right email follow-up.</p><button className="arrow-link">How the call is handled <ArrowRight/></button></article><article onClick={onChat}><div className="tile-top"><MessageCircle/><span className="mono-label">FELICAN PRODUCT</span></div><h2>Website Assistant</h2><p>A business-trained assistant for answering visitor questions, recommending the right service, and capturing qualified inquiries.</p><button className="arrow-link">Open the assistant <ArrowRight/></button></article></section>
    <section className="product-grid-section" id="products"><header><div><p className="mono-label">// PRODUCTS</p><h2>A portfolio you can explore.</h2></div><div className="filter-pills">{['All','AI workspace','Business ops','Creative tools','Developer tools'].map(f=><button className={filter===f?'active':''} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></header><div className="product-grid">{filtered.map(p=><article key={p.name}><div><ProductMark product={p}/><span className="live-status"><i/> {p.status}</span></div><h3>{p.name}</h3><p>{p.description}</p><footer><span>{p.category}</span><ArrowRight/></footer></article>)}</div></section>
    <section className="service-grid-section" id="services"><header><p className="mono-label">// SERVICES</p><h2>One team from discovery through optimization.</h2></header><div>{services.map((s,i)=><article key={s.name}><span className="mono-label">0{i+1}</span><s.icon/><h3>{s.name}</h3><p>{s.description}</p><button>Scope a project <ArrowRight/></button></article>)}</div></section>
    <TrainingBooks/><AboutBand/><FAQ/>
  </main><Footer onCall={onCall} onChat={onChat}/><FloatingChat onClick={onChat}/></div>;
}

const conversationMoments = [
  { overline: 'WHEN YOU CALL US', ask: '“Can I speak with someone about an AI agent?”', reply: 'Absolutely. I can answer a few questions now, transfer you to Legend or Lee, take a message, or email you an overview.', title: 'Our AI answers the Felican line.', body: 'It acts as our front desk: grounded in our company knowledge, ready to help, and able to bring a human into the conversation at the right moment.' },
  { overline: 'ON YOUR WEBSITE', ask: '“Which product is actually right for us?”', reply: 'Tell me your workflow, your team, and where time is getting lost. I’ll narrow it down.', title: 'A website that knows what you do.', body: 'Turn a static site into a useful guide grounded in your approved products, services, policies, and knowledge.' },
  { overline: 'IN THE BACKGROUND', ask: '“Why are we still moving this by hand?”', reply: 'We can connect the intake, document, CRM, follow-up, and reporting steps into one managed workflow.', title: 'Less copy. Less paste. Less chasing.', body: 'Agents and automations can coordinate the routine work while your team stays in control of the important calls.' },
];

function Conversation({ onCall, onChat }) {
  return <div className="concept conversation" id="top"><div className="scroll-progress"/><Nav onCall={onCall} onChat={onChat}/><main>
    <section className="c-hero"><p className="eyebrow">Felican AI company line</p><h1>Call Felican AI.</h1><p className="lede">Our AI receptionist can answer questions about the company or connect you with Legend or Lee.</p><button className="call-company" onClick={onCall}><span><Phone/></span><div><b>{PHONE_DISPLAY}</b><small>Ask a question, leave a message, or request a transfer</small></div><ArrowRight/></button></section>
    <section className="story-intro"><p>Every useful system starts with a real conversation: what is happening now, what keeps getting stuck, and what should feel easier on the other side.</p></section>
    <section className="conversation-moments">{conversationMoments.map((m,i)=><article key={m.overline} className={i%2?'reverse':''}><p className="eyebrow">{String(i+1).padStart(2,'0')} · {m.overline}</p><div className="exchange"><p className="ask">{m.ask}</p><p className="reply"><Sparkles/>{m.reply}</p></div><div className="moment-copy"><h2>{m.title}</h2><p>{m.body}</p><button className="arrow-link">See how it works <ArrowRight/></button></div></article>)}</section>
    <section className="private-diagram"><div><p className="eyebrow">04 · BEHIND YOUR BOUNDARIES</p><h2>Private AI, designed around control.</h2><p>For sensitive teams and regulated workflows, Felican can design AI environments with clear access, approved knowledge, auditability, and controlled integrations.</p><button className="arrow-link">Explore private AI <ArrowRight/></button></div><div className="boundary"><span>Your environment</span><div><LockKeyhole/><b>Company knowledge</b><small>Approved documents · systems · permissions</small></div><div><BrainCircuit/><b>Felican AI layer</b><small>Models · agents · tools · governance</small></div></div></section>
    <section className="compact-products" id="products"><header><p className="eyebrow">05 · THE THINGS WE’VE BUILT</p><h2>Products for people doing the work.</h2></header><ProductIndex limit={8}/><button className="arrow-link">View the full portfolio <ArrowRight/></button></section>
    <section id="services" className="narrative-services"><p className="eyebrow">SERVICES</p><h2>Build it. Connect it. Teach the team. Keep improving it.</h2><div>{services.map(s=><span key={s.name}><s.icon/>{s.name}</span>)}</div></section>
    <TrainingBooks/><AboutBand/><FAQ/>
  </main><Footer onCall={onCall} onChat={onChat}/><FloatingChat onClick={onChat}/></div>;
}

function LegacyApp() {
  const params = new URLSearchParams(window.location.search);
  const requestedDesign = params.get('v');
  const initialDesign = ['broadsheet', 'workbench', 'conversation'].includes(requestedDesign) ? requestedDesign : 'workbench';
  const reviewMode = params.get('review') === '1';
  const [design, setDesign] = useState(initialDesign);
  const [phone, setPhone] = useState(false);
  const [chat, setChat] = useState(false);
  const shared = { onCall: () => setPhone(true), onChat: () => setChat(true) };
  return <>{reviewMode && <DesignSwitcher design={design} setDesign={setDesign}/>} {design === 'broadsheet' && <Broadsheet {...shared}/>} {design === 'workbench' && <Workbench {...shared}/>} {design === 'conversation' && <Conversation {...shared}/>} {phone && <PhoneDemo onClose={()=>setPhone(false)}/>} {chat && <ChatAssistant onClose={()=>setChat(false)}/>}</>;
}

export function App() {
  return <FelicanSite />;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
