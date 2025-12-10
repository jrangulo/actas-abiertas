import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTopUsuarios, getRankingUsuario, getEstadisticaUsuario } from '@/lib/actas'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardAvatar } from '@/components/leaderboard/LeaderboardAvatar'
import { getUserName, getUserAvatarUrl } from '@/lib/users/utils'
import { generateAnonName } from '@/lib/users/anon-names'

const TOP_USUARIOS_LIMIT = 100

export default async function LeaderboardPage() {
  // Obtener el usuario actual
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Obtener datos reales del leaderboard
  const topUsuarios = await getTopUsuarios(TOP_USUARIOS_LIMIT)

  const leaderboardData = topUsuarios.map((u, index) => ({
    position: index + 1,
    userId: u.usuarioId,
    // Respetar configuración de privacidad - generar nombre anónimo único
    name: u.perfilPrivado ? generateAnonName(u.usuarioId) : getUserName(u.rawUserMetaData),
    avatarUrl: u.perfilPrivado ? null : getUserAvatarUrl(u.rawUserMetaData),
    validadas: u.actasValidadas || 0,
  }))

  // Verificar si el usuario actual está en el top 100
  let currentUserEntry = null
  let showEllipsis = false

  const userInTop = leaderboardData.find((u) => u.userId === user?.id)

  if (!userInTop) {
    // El usuario no está en el top, obtener su ranking y estadísticas
    const userRanking = await getRankingUsuario(user?.id || '')

    if (userRanking && userRanking > TOP_USUARIOS_LIMIT) {
      const userStats = await getEstadisticaUsuario(user?.id || '')

      if (userStats && user) {
        currentUserEntry = {
          position: userRanking,
          userId: user?.id || '',
          name: getUserName(user.user_metadata),
          avatarUrl: getUserAvatarUrl(user.user_metadata),
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
              <div className="flex items-end justify-center gap-6 py-4">
                {/* Segundo lugar */}
                {leaderboardData.length > 1 && leaderboardData[1] && (
                  <div className="text-center">
                    <div className="relative mx-auto mb-2">
                      <LeaderboardAvatar
                        position={2}
                        name={leaderboardData[1].name}
                        avatarUrl={leaderboardData[1].avatarUrl}
                        userId={leaderboardData[1].userId}
                        size="xl"
                        isCurrentUser={leaderboardData[1].userId === user?.id}
                      />
                    </div>
                    <p className="font-medium text-sm truncate max-w-20">
                      {leaderboardData[1].name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leaderboardData[1].validadas} actas
                    </p>
                  </div>
                )}

                {/* Primer lugar */}
                {leaderboardData.length > 0 && leaderboardData[0] && (
                  <div className="text-center -mt-4">
                    <div className="relative mx-auto mb-2 ring-4 ring-yellow-400 dark:ring-yellow-600 rounded-full">
                      <LeaderboardAvatar
                        position={1}
                        name={leaderboardData[0].name}
                        avatarUrl={leaderboardData[0].avatarUrl}
                        userId={leaderboardData[0].userId}
                        size="xl"
                        isCurrentUser={leaderboardData[0].userId === user?.id}
                      />
                    </div>
                    <p className="font-bold truncate max-w-[100px]">
                      {leaderboardData[0].name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leaderboardData[0].validadas} actas
                    </p>
                  </div>
                )}

                {/* Tercer lugar */}
                {leaderboardData.length > 2 && leaderboardData[2] && (
                  <div className="text-center">
                    <div className="relative mx-auto mb-2">
                      <LeaderboardAvatar
                        position={3}
                        name={leaderboardData[2].name}
                        avatarUrl={leaderboardData[2].avatarUrl}
                        userId={leaderboardData[2].userId}
                        size="xl"
                        isCurrentUser={leaderboardData[2].userId === user?.id}
                      />
                    </div>
                    <p className="font-medium text-sm truncate max-w-20">
                      {leaderboardData[2].name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leaderboardData[2].validadas} actas
                    </p>
                  </div>
                )}
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
            {leaderboardData.map((entry) => (
              <div
                key={entry.position}
                className="flex items-center gap-3 py-2 border-b last:border-0"
              >
                <LeaderboardAvatar
                  position={entry.position}
                  name={entry.name}
                  avatarUrl={entry.avatarUrl}
                  userId={entry.userId}
                  size="md"
                  isCurrentUser={entry.userId === user?.id}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.validadas} validadas</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.validadas}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            ))}

            {/* Mostrar puntos suspensivos si el usuario no está en el top 100 */}
            {showEllipsis && currentUserEntry && (
              <>
                <div className="flex items-center justify-center py-2">
                  <span className="text-2xl text-muted-foreground">⋯</span>
                </div>
                <div className="flex items-center gap-3 py-2 bg-primary/5 rounded-lg px-3 border-2 border-primary/20">
                  <LeaderboardAvatar
                    position={currentUserEntry.position}
                    name={currentUserEntry.name}
                    avatarUrl={currentUserEntry.avatarUrl}
                    size="md"
                    isCurrentUser={true}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentUserEntry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUserEntry.validadas} validadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{currentUserEntry.validadas}</p>
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
