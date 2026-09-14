'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
export default function Navigation() {
  const pathname = usePathname()
  return <nav aria-label="Main navigation">{['About', 'Projects', 'Blog', 'Photos'].map(label => {
    const href = '/' + label.toLowerCase()
    const active = pathname === href || pathname.startsWith(href + '/')
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined}>{label}</Link>
  })}</nav>
}
