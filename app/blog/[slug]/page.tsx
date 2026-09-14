import Link from 'next/link'
import { notFound } from 'next/navigation'
const posts: Record<string, { title: string; date: string; description: string }> = {
 'first-post': { title: 'My First Post', date: '2026-02-21', description: 'A first entry is on its way.' },
 'on-systematic-trading': { title: 'Some Thoughts on Systematic Trading', date: '2026-02-15', description: 'Notes on building systematic strategies and what actually matters.' },
}
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) { const post = posts[(await params).slug]; return { title: post ? post.title + ' | Max Ma' : 'Post not found | Max Ma', robots: { index: false, follow: true } } }
export default async function BlogPost({ params }: Props) {
 const post = posts[(await params).slug]
 if (!post) notFound()
 return <div className="reading-page"><Link className="back-link" href="/blog">← All writing</Link><p className="kicker">{post.date} · FORTHCOMING</p><h1>{post.title}</h1><p className="detail-intro">{post.description}</p><p className="status-note">This article is not published yet. In the meantime, explore the <Link className="text-link" href="/projects">projects</Link> or the <Link className="text-link" href="/photos">photo journal</Link>.</p></div>
}
