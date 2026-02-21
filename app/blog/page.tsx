import Link from 'next/link'

const posts = [
  {
    slug: 'first-post',
    title: 'My First Post',
    date: '2026-02-21',
    description: 'A placeholder post to show how the blog structure works.',
  },
  {
    slug: 'on-systematic-trading',
    title: 'Some Thoughts on Systematic Trading',
    date: '2026-02-15',
    description: 'Notes on building systematic strategies and what actually matters.',
  },
]

export default function Blog() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">

      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-gray-500 mb-10">
        Writing on trading, mathematics, and whatever else is on my mind.
      </p>

      <div className="space-y-10">
        {posts.map((post) => (
          <article key={post.slug}>
            <p className="text-sm text-gray-400 mb-1">{post.date}</p>
            <h2 className="text-xl font-semibold mb-1">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600">{post.description}</p>
          </article>
        ))}
      </div>

    </div>
  )
}