type Props = {
    params: { slug: string }
  }
  
  export default function ProjectPost({ params }: Props) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
  
        <p className="text-sm text-gray-400 mb-2">2026</p>
        <h1 className="text-3xl font-bold mb-4">Project Title</h1>
  
        <div className="flex gap-2 mb-8">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Python</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Finance</span>
        </div>
  
        <hr className="border-gray-200 mb-10" />
  
        <div className="space-y-6 text-gray-700 leading-relaxed">
  
          <p>
            Overview paragraph — what is this project, why did you build it, what problem does it solve.
          </p>
  
          <h2 className="text-xl font-semibold pt-4">Motivation</h2>
          <p>
            Why you started it and what you were trying to figure out.
          </p>
  
          <h2 className="text-xl font-semibold pt-4">How it works</h2>
          <p>
            Technical explanation. You can go as deep as you like here.
          </p>
  
          <h2 className="text-xl font-semibold pt-4">Results / Status</h2>
          <p>
            Current state, what it does, what you learned.
          </p>
  
          {/* Link to GitHub repo if public */}
          <p>
            <a href="https://github.com/MMCM0451" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
              View on GitHub →
            </a>
          </p>
  
        </div>
  
      </div>
    )
  }