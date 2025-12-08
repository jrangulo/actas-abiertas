import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award } from 'lucide-react'

// TODO: Obtener datos reales del leaderboard
const leaderboardData = [
  { position: 1, name: 'María González', digitadas: 156, validadas: 89 },
  { position: 2, name: 'Carlos Rodríguez', digitadas: 142, validadas: 112 },
  { position: 3, name: 'Ana López', digitadas: 128, validadas: 95 },
  { position: 4, name: 'Pedro Martínez', digitadas: 115, validadas: 78 },
  { position: 5, name: 'Laura Hernández', digitadas: 102, validadas: 134 },
  { position: 6, name: 'José García', digitadas: 98, validadas: 67 },
  { position: 7, name: 'Carmen Flores', digitadas: 91, validadas: 82 },
  { position: 8, name: 'Miguel Torres', digitadas: 87, validadas: 71 },
  { position: 9, name: 'Sofia Ruiz', digitadas: 82, validadas: 59 },
  { position: 10, name: 'Diego Mendoza', digitadas: 78, validadas: 88 },
]

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
        <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      </div>
    )
  }
  if (position === 2) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800">
        <Medal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </div>
    )
  }
  if (position === 3) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
      <span className="font-bold text-muted-foreground">{position}</span>
    </div>
  )
}

export default function LeaderboardPage() {
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
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Medal className="h-8 w-8 text-gray-500 dark:text-gray-400" />
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
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center ring-4 ring-yellow-200 dark:ring-yellow-800">
                    <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
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
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Award className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="font-medium text-sm truncate max-w-[80px]">
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
            <CardTitle className="text-base">Ranking completo</CardTitle>
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
                <div className="text-right">
                  <p className="font-bold">{user.digitadas + user.validadas}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
