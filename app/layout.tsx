import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Max Ma',
  description: 'Macro trader, mathematician, and occasional writer.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-sm">
              Max Ma
            </Link>
            <nav className="flex gap-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-gray-900">About</Link>
              <Link href="/projects" className="hover:text-gray-900">Projects</Link>
              <Link href="/blog" className="hover:text-gray-900">Blog</Link>
              <Link href="/photos" className="hover:text-gray-900">Photos</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}