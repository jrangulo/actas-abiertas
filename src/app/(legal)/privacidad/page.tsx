import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Actas Abiertas',
  description: 'Política de privacidad de Actas Abiertas',
}

export default function PrivacidadPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p className="lead">Última actualización: {new Date().toLocaleDateString('es-HN')}</p>

      <p>
        Actas Abiertas (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la plataforma&quot;) se
        compromete a proteger tu privacidad. Esta política explica cómo recopilamos, usamos y
        protegemos tu información personal.
      </p>

      <h2>1. Información que Recopilamos</h2>

      <h3>1.1 Información de Registro</h3>
      <p>Cuando te registras en nuestra plataforma, recopilamos:</p>
      <ul>
        <li>
          <strong>Con Google/Facebook:</strong> Tu nombre, foto de perfil y dirección de correo
          electrónico (proporcionados por el proveedor de autenticación)
        </li>
        <li>
          <strong>Con correo electrónico:</strong> Tu dirección de correo electrónico y contraseña
          (la contraseña se almacena de forma segura y encriptada)
        </li>
      </ul>

      <h3>1.2 Información de Actividad</h3>
      <p>Registramos tu actividad en la plataforma:</p>
      <ul>
        <li>Cantidad de actas validadas</li>
        <li>Precisión de tus validaciones (comparada con el consenso)</li>
        <li>Fechas de actividad</li>
      </ul>

      <h3>1.3 Información Técnica</h3>
      <p>
        Automáticamente recopilamos información técnica como tu dirección IP, tipo de navegador y
        dispositivo para mejorar la seguridad y experiencia del usuario.
      </p>

      <h2>2. Cómo Usamos tu Información</h2>
      <p>Utilizamos tu información para:</p>
      <ul>
        <li>Permitirte acceder y usar la plataforma</li>
        <li>Mostrar tu progreso y estadísticas en tu perfil</li>
        <li>Mostrar rankings públicos (respetando tu configuración de privacidad)</li>
        <li>Detectar y prevenir actividades fraudulentas o maliciosas</li>
        <li>Mejorar la plataforma y corregir errores</li>
      </ul>

      <h2>3. Información que Compartimos</h2>

      <h3>3.1 Información Pública</h3>
      <p>Por defecto, tu nombre y foto de perfil pueden aparecer en:</p>
      <ul>
        <li>El ranking público de verificadores</li>
        <li>Tu posición en el leaderboard</li>
      </ul>
      <p>
        <strong>Puedes desactivar esto</strong> en la sección de privacidad de tu perfil,
        apareciendo como &quot;Anónimo&quot; con un avatar genérico.
      </p>

      <h3>3.2 Información que NUNCA Compartimos</h3>
      <ul>
        <li>
          <strong>Tu correo electrónico:</strong> Siempre es privado y nunca se muestra a otros
          usuarios
        </li>
        <li>
          <strong>Tu contraseña:</strong> Está encriptada y no tenemos acceso a ella
        </li>
        <li>
          <strong>Datos con terceros:</strong> No vendemos ni compartimos tus datos con terceros
          para fines comerciales
        </li>
      </ul>

      <h2>4. Seguridad de los Datos</h2>
      <p>Protegemos tu información mediante:</p>
      <ul>
        <li>Encriptación HTTPS en todas las conexiones</li>
        <li>Row Level Security (RLS) en nuestra base de datos</li>
        <li>Autenticación segura a través de Supabase</li>
        <li>Almacenamiento en servidores con certificaciones de seguridad de la industria</li>
      </ul>

      <h2>5. Tus Derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>
          <strong>Acceder</strong> a tu información personal en cualquier momento desde tu perfil
        </li>
        <li>
          <strong>Modificar</strong> tu configuración de privacidad
        </li>
        <li>
          <strong>Eliminar</strong> tu cuenta y datos personales contactándonos
        </li>
        <li>
          <strong>Exportar</strong> tus datos en un formato legible
        </li>
      </ul>

      <h2>6. Retención de Datos</h2>
      <p>
        Mantenemos tu información mientras tu cuenta esté activa. Si solicitas la eliminación de tu
        cuenta, eliminaremos tu información personal dentro de 30 días. Las validaciones que hayas
        realizado permanecerán de forma anónima para mantener la integridad de los datos
        electorales.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos cookies esenciales para mantener tu sesión activa y preferencias. No utilizamos
        cookies de seguimiento publicitario.
      </p>

      <h2>8. Menores de Edad</h2>
      <p>
        Esta plataforma está destinada a personas mayores de 18 años. No recopilamos
        intencionalmente información de menores de edad.
      </p>

      <h2>9. Base de Datos Pública</h2>
      <p>
        Tenemos planes de liberar una versión de solo lectura de la base de datos de actas
        verificadas para uso público. Esta versión <strong>NO incluirá</strong> ningún dato personal
        de los usuarios, solo los valores verificados de las actas electorales.
      </p>

      <h2>10. Cambios a esta Política</h2>
      <p>
        Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos
        a través de la plataforma o por correo electrónico.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para preguntas sobre privacidad o para ejercer tus derechos, puedes contactarnos a través
        de:
      </p>
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
        Esta política de privacidad es efectiva a partir de la fecha indicada arriba y aplica a
        todos los usuarios de la plataforma Actas Abiertas.
      </p>
    </>
  )
}
