import { config } from '@/lib/config'

export default function About() {
    return (
      <div className="reading-page">
  
        {/* Page title */}
        <h1 className="text-3xl font-bold mb-10">About</h1>
  
        {/* A section with a heading and paragraphs */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Background</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            I'm Max, a graduate trader on the Macro & Rates desk at Rothesay in London.
            I studied Mathematics at Trinity College, Cambridge, graduating in 2025.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Before finance I spent a lot of time doing competition mathematics — BMO distinction,
            BPhO Top Gold - and before that growing up in Wallington, Surrey.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This site is a place for my writing, projects, and whatever else I feel like putting here.
            Not everything here is professional - some of it is just personal.
          </p>
        </section>
  
        {/* A simple horizontal divider */}
        <hr className="border-gray-200 mb-10" />
  
        {/* A section with a list */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Interests</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Macro trading and systematic strategies</li>
            <li>Mathematics, particularly probability and analysis</li>
            <li>Chess, Go, and poker</li>
            <li>Badminton, tennis, table tennis, and padel</li>
            <li>Travel: recent highlights include Grindelwald and Paris</li>
          </ul>
        </section>
  
        <hr className="border-gray-200 mb-10" />
  
        {/* A section with an external link */}
        <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Elsewhere</h2>
        <p className="text-gray-700 leading-relaxed">
          You can find me on{' '}
          <a href={config.links.linkedin} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
            LinkedIn
          </a>
          {' '}and{' '}
          <a href={config.links.github} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
            GitHub
          </a>
          {'. '}For anything else, reach me at{' '}
          <a href={'mailto:' + config.email} className="underline hover:text-gray-900">
            {config.email}
          </a>
          .
        </p>
      </section>
    </div>
  )
}