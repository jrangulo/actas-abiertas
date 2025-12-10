import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio | Actas Abiertas',
  description: 'Términos de servicio de Actas Abiertas',
}

export default function TerminosPage() {
  return (
    <>
      <h1>Términos de Servicio</h1>
      <p className="lead">Última actualización: {new Date().toLocaleDateString('es-HN')}</p>

      <p>
        Bienvenido a Actas Abiertas. Al usar nuestra plataforma, aceptas estos términos de servicio.
        Por favor léelos cuidadosamente.
      </p>

      <h2>1. Descripción del Servicio</h2>
      <p>
        Actas Abiertas es una plataforma de observación ciudadana independiente que permite a los
        usuarios verificar y validar de forma colaborativa las actas electorales de Honduras. El
        proyecto es de código abierto y no tiene afiliación con ningún partido político, candidato u
        organización gubernamental.
      </p>

      <h2>2. Elegibilidad</h2>
      <p>Para usar esta plataforma, debes:</p>
      <ul>
        <li>Ser mayor de 18 años</li>
        <li>Proporcionar información veraz al registrarte</li>
        <li>Usar un correo electrónico real (no se permiten correos temporales o desechables)</li>
      </ul>

      <h2>3. Registro y Cuenta</h2>
      <ul>
        <li>Eres responsable de mantener la confidencialidad de tu cuenta</li>
        <li>No debes compartir tu acceso con otras personas</li>
        <li>Debes notificarnos inmediatamente si sospechas de uso no autorizado de tu cuenta</li>
      </ul>

      <h2>4. Uso Aceptable</h2>
      <p>Al usar la plataforma, te comprometes a:</p>
      <ul>
        <li>
          <strong>Actuar de buena fe:</strong> Ingresar los datos de las actas de manera precisa y
          honesta según lo que observas en las imágenes
        </li>
        <li>
          <strong>No manipular datos:</strong> No ingresar información falsa intencionalmente
        </li>
        <li>
          <strong>No automatizar:</strong> No usar bots, scripts o herramientas automatizadas para
          interactuar con la plataforma
        </li>
        <li>
          <strong>Respetar la plataforma:</strong> No intentar vulnerar la seguridad, sobrecargar
          los servidores o interferir con el funcionamiento normal
        </li>
      </ul>

      <h2>5. Sistema de Calidad y Restricciones</h2>
      <p>
        Para mantener la integridad de los datos, implementamos un sistema de control de calidad:
      </p>
      <ul>
        <li>
          <strong>Validación por consenso:</strong> Cada acta es verificada por múltiples usuarios
          independientes
        </li>
        <li>
          <strong>Seguimiento de precisión:</strong> Monitoreamos la precisión de las validaciones
          de cada usuario
        </li>
        <li>
          <strong>Sistema de advertencias:</strong> Si tu tasa de error supera el 10% (precisión
          menor al 90%), recibirás una advertencia
        </li>
        <li>
          <strong>Restricciones:</strong> Usuarios con tasa de error mayor al 20% (precisión menor
          al 80%) pueden ser restringidos
        </li>
        <li>
          <strong>Suspensión:</strong> Si la tasa de error supera el 30% (precisión menor al 70%),
          la cuenta será suspendida y las contribuciones eliminadas
        </li>
      </ul>
      <p>
        Este sistema existe para detectar errores sistemáticos y posibles intentos de manipulación,
        no para penalizar errores ocasionales.
      </p>

      <h2>6. Propiedad Intelectual</h2>
      <ul>
        <li>
          El código fuente de la plataforma es de código abierto bajo licencia MIT y está disponible
          en GitHub
        </li>
        <li>Las imágenes de las actas son de dominio público</li>
        <li>
          Los datos de validación generados por la comunidad serán liberados públicamente para
          beneficio de la sociedad
        </li>
      </ul>

      <h2>7. Privacidad</h2>
      <p>
        Tu privacidad es importante para nosotros. Por favor revisa nuestra{' '}
        <a href="/privacidad">Política de Privacidad</a> para entender cómo recopilamos, usamos y
        protegemos tu información.
      </p>

      <h2>8. Limitación de Responsabilidad</h2>
      <ul>
        <li>La plataforma se proporciona &quot;tal cual&quot;, sin garantías de ningún tipo</li>
        <li>
          No garantizamos la precisión absoluta de los datos verificados, aunque implementamos
          múltiples capas de validación
        </li>
        <li>No somos responsables de decisiones tomadas basadas en los datos de la plataforma</li>
        <li>
          No somos responsables de interrupciones del servicio, pérdida de datos o daños derivados
          del uso de la plataforma
        </li>
      </ul>

      <h2>9. Independencia Política</h2>
      <p>
        Actas Abiertas es un proyecto independiente sin afiliación política. El objetivo es
        proporcionar transparencia y datos verificables, no favorecer a ningún partido o candidato.
        Cualquier intento de usar la plataforma para manipular resultados o difundir información
        falsa resultará en la suspensión inmediata de la cuenta.
      </p>

      <h2>10. Modificaciones al Servicio</h2>
      <p>Nos reservamos el derecho de:</p>
      <ul>
        <li>Modificar o discontinuar la plataforma en cualquier momento</li>
        <li>Actualizar estos términos de servicio</li>
        <li>Suspender cuentas que violen estos términos</li>
      </ul>

      <h2>11. Terminación</h2>
      <p>
        Puedes dejar de usar la plataforma en cualquier momento. También puedes solicitar la
        eliminación de tu cuenta contactándonos.
      </p>
      <p>
        Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos sin
        previo aviso.
      </p>

      <h2>12. Ley Aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de Honduras. Cualquier disputa será resuelta en los
        tribunales competentes de Honduras.
      </p>

      <h2>13. Contacto</h2>
      <p>Para preguntas sobre estos términos, puedes contactarnos a través de:</p>
      <ul>
        <li>
          GitHub:{' '}
          <a
            href="https://github.com/jrangulo/actas-abiertas/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir un issue
          </a>
        </li>
      </ul>

      <hr />

      <p className="text-sm text-muted-foreground">
        Al registrarte y usar Actas Abiertas, confirmas que has leído, entendido y aceptado estos
        términos de servicio.
      </p>
    </>
  )
}
