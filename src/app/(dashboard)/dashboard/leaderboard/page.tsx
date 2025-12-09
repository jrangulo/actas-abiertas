import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award } from 'lucide-react'
import { getTopUsuarios, getRankingUsuario, getEstadisticaUsuario } from '@/lib/actas'
import { createClient } from '@/lib/supabase/server'
import { PositionBadge } from '@/components/leaderboard/PositionBadge'
import { getUserName } from '@/lib/users/utils'

const TOP_USUARIOS_LIMIT = 100

export default async function LeaderboardPage() {
  // Obtener el usuario actual
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Obtener datos reales del leaderboard
  const topUsuarios = await getTopUsuarios(TOP_USUARIOS_LIMIT)

  const leaderboardData = topUsuarios.map((user, index) => ({
    position: index + 1,
    userId: user.usuarioId,
    name: getUserName(user.rawUserMetaData),
    digitadas: user.actasDigitadas || 0,
    validadas: user.actasValidadas || 0,
  }))

  // Verificar si el usuario actual está en el top 10
  let currentUserEntry = null
  let showEllipsis = false

  const userInTop = leaderboardData.find((u) => u.userId === user?.id)

  if (!userInTop) {
    // El usuario no está en el top, obtener su ranking y estadísticas
    const userRanking = await getRankingUsuario(user?.id || '')

    if (userRanking && userRanking > TOP_USUARIOS_LIMIT) {
      const userStats = await getEstadisticaUsuario(user?.id || '')
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (userStats && authUser) {
        currentUserEntry = {
          position: userRanking,
          userId: user?.id || '',
          name: getUserName(authUser.user_metadata),
          digitadas: userStats.actasDigitadas || 0,
          validadas: userStats.actasValidadas || 0,
        }
        showEllipsis = true
      }
    }
  }

  return (
    <div className="space-y-6 py-4 lg:py-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Los héroes de la verificación</p>
      </div>

      {/* Desktop: Side-by-side podium and list */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Top 3 destacado - Podium */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Podio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-4 py-4">
                {/* Segundo lugar */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <Award className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="font-medium text-sm truncate max-w-[80px]">
                    {leaderboardData[1]?.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leaderboardData[1]?.digitadas + leaderboardData[1]?.validadas} actas
                  </p>
                </div>

                {/* Primer lugar */}
                <div className="text-center -mt-4">
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-yellow-200 dark:bg-yellow-900/40 flex items-center justify-center ring-4 ring-yellow-200 dark:ring-yellow-800">
                    <Award className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <p className="font-bold truncate max-w-[100px]">
                    {leaderboardData[0]?.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leaderboardData[0]?.digitadas + leaderboardData[0]?.validadas} actas
                  </p>
                </div>

                {/* Tercer lugar */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-orange-200 dark:bg-orange-900/40 flex items-center justify-center">
                    <Award className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="font-medium text-sm truncate max-w-20">
                    {leaderboardData[2]?.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leaderboardData[2]?.digitadas + leaderboardData[2]?.validadas} actas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista completa */}
        <Card className="mt-6 lg:mt-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Top {TOP_USUARIOS_LIMIT} con más contribuciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboardData.map((user) => (
              <div
                key={user.position}
                className="flex items-center gap-3 py-2 border-b last:border-0"
              >
                <PositionBadge position={user.position} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.digitadas} digitadas · {user.validadas} validadas
                  </p>
                </div>
                <div
                  className={`text-center rounded-full  ${
                    user.position === 1
                      ? 'bg-yellow-600'
                      : user.position === 2
                        ? 'bg-gray-600'
                        : user.position === 3
                          ? 'bg-amber-600'
                          : 'bg-muted'
                  } px-4`}
                >
                  <p className="font-bold">{user.digitadas + user.validadas}</p>
                  <p className="text-xs text-stone-200">total</p>
                </div>
              </div>
            ))}

            {/* Mostrar puntos suspensivos si el usuario no está en el top 10 */}
            {showEllipsis && currentUserEntry && (
              <>
                <div className="flex items-center justify-center py-2">
                  <span className="text-2xl text-muted-foreground">⋯</span>
                </div>
                <div className="flex items-center gap-3 py-2 bg-primary/5 rounded-lg px-3 border-2 border-primary/20">
                  <PositionBadge position={currentUserEntry.position} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {currentUserEntry.name}{' '}
                      <span className="text-xs text-muted-foreground">(Tú)</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUserEntry.digitadas} digitadas · {currentUserEntry.validadas}{' '}
                      validadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {currentUserEntry.digitadas + currentUserEntry.validadas}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
