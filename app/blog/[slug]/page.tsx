type Props = {
    params: { slug: string }
  }
  
  export default function BlogPost({ params }: Props) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
  
        {/* Post header */}
        <p className="text-sm text-gray-400 mb-2">2026-02-21</p>
        <h1 className="text-3xl font-bold mb-4">My First Post</h1>
        <p className="text-gray-500 mb-10">A placeholder post.</p>
  
        <hr className="border-gray-200 mb-10" />
  
        {/* Post body — each paragraph is a <p> block */}
        <div className="space-y-6 text-gray-700 leading-relaxed">
  
          <p>
            This is the first paragraph of the post. You write each paragraph as its
            own <code className="bg-gray-100 px-1 rounded text-sm">p</code> tag.
            Spacing between them is handled by the space-y-6 class on the wrapper div.
          </p>
  
          <p>
            This is the second paragraph. Notice there is no blank line needed in the
            code — the spacing is purely CSS. You just keep adding p tags.
          </p>
  
          {/* A subheading within a post */}
          <h2 className="text-xl font-semibold pt-4">A subheading</h2>
  
          <p>
            You can break up longer posts with h2 subheadings like the one above.
            Just drop one in wherever the post changes topic.
          </p>
  
          {/* An inline code snippet */}
          <p>
            If you ever want to reference code inline, wrap it like{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">this</code>.
          </p>
  
          {/* A blockquote */}
          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-500">
            If you want to highlight a quote or pull out a key idea, use a blockquote like this.
          </blockquote>
  
        </div>
  
      </div>
    )
  }