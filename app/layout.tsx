import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import Navigation from './navigation'
import { config } from '@/lib/config'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.maxma.me'),
  title: 'Max Ma',
  description: config.tagline,
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="wordmark">Max Ma<span aria-hidden="true">.</span></Link>
      <Navigation />
    </div></header>
    <main id="main-content">{children}</main>
    <footer className="site-footer"><div><Link className="footer-name" href="/">Max Ma</Link><p>Macro trader, mathematician, and occasional writer.</p></div>
      <nav aria-label="Social links"><a href={config.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href={config.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href={'mailto:' + config.email}>Email ↗</a></nav>
    </footer>
  </body></html>
}
