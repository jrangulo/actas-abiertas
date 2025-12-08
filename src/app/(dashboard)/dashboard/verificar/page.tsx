import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileCheck, PenLine, CheckSquare, Clock, Users } from 'lucide-react'

export default function VerificarPage() {
  // TODO: Obtener estadísticas reales
  const stats = {
    actasPendientes: 15306,
    actasParaValidar: 1349,
  }

  return (
    <div className="space-y-6 py-4 lg:py-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Verificar Actas</h1>
        <p className="text-muted-foreground">Elige cómo quieres contribuir</p>
      </div>

      {/* Desktop: Side-by-side cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Opción: Digitalizar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenLine className="h-5 w-5 text-[#0069b4]" />
              Digitalizar acta
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground flex-1">
              Transcribe los datos de un acta que aún no ha sido procesada. Serás el primero en
              ingresar los valores.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>
                <strong className="text-foreground">
                  {stats.actasPendientes.toLocaleString()}
                </strong>{' '}
                actas pendientes
              </span>
            </div>
            <Button className="w-full bg-[#0069b4] hover:bg-[#004a7c]">
              <FileCheck className="mr-2 h-4 w-4" />
              Comenzar a digitalizar
            </Button>
          </CardContent>
        </Card>

        {/* Opción: Validar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Validar acta
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground flex-1">
              Revisa un acta que ya fue digitalizada y confirma que los datos son correctos o
              reporta discrepancias.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-lg">
              <Users className="h-4 w-4" />
              <span>
                <strong className="text-foreground">
                  {stats.actasParaValidar.toLocaleString()}
                </strong>{' '}
                listas para validar
              </span>
            </div>
            <Button variant="outline" className="w-full">
              <CheckSquare className="mr-2 h-4 w-4" />
              Comenzar a validar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info sobre el proceso */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="lg:flex lg:items-start lg:gap-8">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">¿Cómo funciona?</h3>
              <p className="text-sm text-muted-foreground">
                Cada acta necesita ser digitalizada una vez y validada por al menos 3 personas
                diferentes para garantizar la precisión de los datos.
              </p>
            </div>
            <div className="mt-4 lg:mt-0 lg:flex-1">
              <h3 className="font-semibold mb-2">¿Por qué importa?</h3>
              <p className="text-sm text-muted-foreground">
                Tu participación ayuda a crear un registro transparente e independiente de los
                resultados electorales de Honduras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
