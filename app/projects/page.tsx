import Link from 'next/link'

const projects = [
  {
    slug: 'agentic-hedge-fund',
    title: 'Agentic Hedge Fund',
    date: '2026',
    description: 'A multi-pod backtesting system with AI agents across macro, FX, commodities, and volatility strategies.',
    tags: ['Python', 'AI', 'Finance'],
  },
  {
    slug: 'personal-website',
    title: 'Personal Website',
    date: '2026',
    description: 'This site — built with Next.js, Tailwind, and deployed on Vercel.',
    tags: ['Next.js', 'Tailwind', 'Vercel'],
  },
]

export default function Projects() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">

      <h1 className="text-3xl font-bold mb-2">Projects</h1>
      <p className="text-gray-500 mb-10">
        Things I have built or am building.
      </p>

      <div className="space-y-10">
        {projects.map((project) => (
          <article key={project.slug}>
            <p className="text-sm text-gray-400 mb-1">{project.date}</p>
            <h2 className="text-xl font-semibold mb-1">
              <Link href={`/projects/${project.slug}`} className="hover:underline">
                {project.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-3">{project.description}</p>
            <div className="flex gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

    </div>
  )
}