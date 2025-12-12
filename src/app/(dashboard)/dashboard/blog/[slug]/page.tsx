import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { getComentariosDePost } from '@/lib/blog/comments'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { ArrowLeft, Calendar, Clock, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ComentarioForm } from './comentario-form'
import { ComentariosList } from './comentarios-list'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return { title: 'Post no encontrado | Actas Abiertas' }
  }

  return {
    title: `${post.title} | Blog | Actas Abiertas`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const supabase = await createClient()
  const [
    {
      data: { user },
    },
    comentarios,
  ] = await Promise.all([supabase.auth.getUser(), getComentariosDePost(slug)])

  return (
    <div className="py-4 lg:py-6 max-w-3xl mx-auto">
      {/* Back button */}
      <Link href="/dashboard/blog">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al blog
        </Button>
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.readingTime}
          </span>
        </div>
      </header>

      {/* Content */}
      <article className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground/90 prose-a:text-purple-500 prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={post.content} />
      </article>

      {/* Comments */}
      <section className="mt-12 pt-8 border-t">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle className="text-base">Comentarios</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Deja feedback o preguntas. Si tienes perfil privado, aparecerás como anónimo.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ComentarioForm slug={slug} />
            <ComentariosList comentarios={comentarios} currentUserId={user?.id} />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t">
        <Link href="/dashboard/blog">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver todas las publicaciones
          </Button>
        </Link>
      </footer>
    </div>
  )
}

function formatDate(dateStr: string): string {
  // Si viene como "YYYY-MM-DD", parsearlo como fecha local para evitar off-by-one por zona horaria.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? (() => {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d)
      })()
    : new Date(dateStr)
  return date.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
