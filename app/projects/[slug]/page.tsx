import Link from 'next/link'
import { notFound } from 'next/navigation'
const projects: Record<string, { title: string; description: string; tags: string; note: string }> = {
  'personal-website': { title: 'Personal Website', description: 'This site — built with Next.js, Tailwind, and deployed on Vercel.', tags: 'NEXT.JS / TAILWIND / VERCEL', note: 'A home for projects, writing, and a photo journal of travel and life in between.' },
}
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) { const project = projects[(await params).slug]; return { title: project ? project.title + ' | Max Ma' : 'Project not found | Max Ma' } }
export default async function ProjectPost({ params }: Props) {
  const project = projects[(await params).slug]
  if (!project) notFound()
  return <div className="reading-page"><Link className="back-link" href="/projects">← All projects</Link><p className="kicker">2026 · {project.tags}</p><h1>{project.title}</h1><p className="detail-intro">{project.description}</p><p className="status-note">{project.note}</p></div>
}
