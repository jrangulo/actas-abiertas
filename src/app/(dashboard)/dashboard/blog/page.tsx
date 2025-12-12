import Link from 'next/link'
import { getAllPosts, getLatestPostDate } from '@/lib/blog'
import { Calendar, Clock, ArrowRight, Newspaper, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BlogSeenMarker } from './blog-seen-marker'

export const metadata = {
  title: 'Blog | Actas Abiertas',
  description: 'Actualizaciones y noticias sobre el proyecto Actas Abiertas',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const latestPostDate = getLatestPostDate()

  return (
    <div className="py-4 lg:py-6 space-y-6">
      {/* Mark posts as seen when visiting the blog */}
      <BlogSeenMarker latestPostDate={latestPostDate} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-purple-500/10">
          <Newspaper className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">Actualizaciones y noticias del proyecto</p>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay publicaciones todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <Link key={post.slug} href={`/dashboard/blog/${post.slug}`} className="block">
              <Card className="group hover:border-purple-500/50 transition-all duration-200 hover:shadow-md">
                <CardContent className="p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-500 rounded-full">
                            Nuevo
                          </span>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readingTime}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-lg lg:text-xl font-semibold mb-2 group-hover:text-purple-500 transition-colors">
                        {post.title}
                      </h2>

                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>

                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
