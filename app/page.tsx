import Link from 'next/link'
import Image from 'next/image'
import { config } from '@/lib/config'

export default function Home() {
  return <div className="home page-wide">
    <section className="home-intro" aria-labelledby="intro-title">
      <div className="intro-copy"><p className="kicker">LONDON · MATHEMATICS · MARKETS</p>
        <h1 id="intro-title">Max Ma<span className="accent">.</span></h1>
        <p className="home-tagline">{config.tagline}</p>
        <p className="home-bio">I'm Max, a graduate trader on the Macro &amp; Rates desk at Rothesay in London. I studied Mathematics at Trinity College, Cambridge, graduating in 2025.</p>
        <Link className="text-link" href="/about">A little more about me <span aria-hidden="true">↗</span></Link>
      </div>
      <figure className="home-portrait"><Link href="/photos" aria-label="Explore the Grindelwald photo journal"><Image src="/photos/winter/photo-3.jpg" alt="Max at a viewpoint above the snowy mountains in Grindelwald." width={960} height={1280} sizes="(max-width: 700px) 90vw, 380px" priority /></Link><figcaption><span>Grindelwald, Switzerland</span><span>02 / 2026</span></figcaption></figure>
    </section>
    <section className="home-work" aria-labelledby="work-title"><div className="section-heading"><div><p className="kicker">SELECTED WORK</p><h2 id="work-title">Ideas into practice.</h2></div><Link className="text-link" href="/projects">All projects ↗</Link></div>
      <Link className="project-row" href="/projects/agentic-hedge-fund"><span className="row-index">01</span><div><h3>Agentic Hedge Fund</h3><p>A multi-pod backtesting system with AI agents across macro, FX, commodities, and volatility strategies.</p><span className="small-label">PYTHON / AI / FINANCE</span></div><span className="row-arrow" aria-hidden="true">↗</span></Link>
      <Link className="project-row" href="/projects/personal-website"><span className="row-index">02</span><div><h3>Personal Website</h3><p>This site — built with Next.js, Tailwind, and deployed on Vercel.</p><span className="small-label">NEXT.JS / TAILWIND / VERCEL</span></div><span className="row-arrow" aria-hidden="true">↗</span></Link>
    </section>
    <section className="home-personal" aria-labelledby="personal-title"><div><p className="kicker">AWAY FROM THE DESK</p><h2 id="personal-title">Life in between.</h2><p>This site is a place for my writing, projects, and whatever else I feel like putting here. Not everything here is professional - some of it is just personal.</p><Link className="text-link" href="/photos">Open the photo journal ↗</Link></div><Link className="journal-teaser" href="/photos"><Image src="/photos/winter/photo-4.jpg" alt="A mountain drawing held against the winter view in Grindelwald." width={960} height={1280} sizes="(max-width: 700px) 90vw, 420px" /><span>Winter in Grindelwald <span aria-hidden="true">↗</span></span></Link></section>
  </div>
}
