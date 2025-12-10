'use client'

import { useState } from 'react'
import {
  ChevronDown,
  HelpCircle,
  Shield,
  Eye,
  Database,
  Users,
  Lock,
  Mail,
  AlertTriangle,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  icon: React.ReactNode
}

const faqItems: FAQItem[] = [
  {
    question: '¿Qué datos guardan cuando me registro?',
    answer:
      'Cuando te registras con Google, guardamos únicamente tu identificador único de usuario (ID), tu nombre y tu foto de perfil (si la tienes). También guardamos estadísticas de tu actividad en la plataforma: cantidad de actas digitalizadas, validadas, y tu precisión. No tenemos acceso a tu contraseña ni a otros datos de tu cuenta de Google.',
    icon: <Database className="h-5 w-5" />,
  },
  {
    question: '¿Pueden ver mi correo electrónico otros usuarios?',
    answer:
      'No. Tu correo electrónico es completamente privado y nunca se muestra a otros usuarios. Solo tú puedes verlo en tu perfil. En los leaderboards y otras secciones públicas solo se muestra tu nombre (si lo permites) o un identificador anónimo.',
    icon: <Mail className="h-5 w-5" />,
  },
  {
    question: '¿Puedo ocultar mi nombre y foto en los leaderboards?',
    answer:
      'Sí. En la sección de "Mi Perfil" puedes configurar tu privacidad y elegir aparecer como anónimo en los rankings públicos. Si eliges esta opción, se mostrará "Anónimo" en lugar de tu nombre y una imagen genérica en lugar de tu foto.',
    icon: <Eye className="h-5 w-5" />,
  },
  {
    question: '¿Cómo funciona el sistema de validación?',
    answer:
      'Cada acta pasa por un proceso de validación con múltiples usuarios independientes. Primero, un usuario digitaliza los valores del acta. Luego, otros tres usuarios validan esos valores de forma independiente. Si al menos dos de los tres validadores coinciden, esos valores se consideran correctos. Este sistema de consenso ayuda a garantizar la precisión de los datos.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    question: '¿Qué pasa si cometo un error al digitalizar?',
    answer:
      'No te preocupes. El sistema de validación por consenso está diseñado para detectar y corregir errores. Si tus valores no coinciden con los de otros validadores, el sistema registra una "corrección recibida" en tu perfil. Sin embargo, si acumulas muchas correcciones y tu precisión baja significativamente (por debajo del 70%), recibirás una advertencia. Si continúa bajando, podrías ser restringido o suspendido temporalmente. Este sistema progresivo existe para mantener la calidad de los datos y detectar posibles malos actores, pero no te preocupes si cometes errores ocasionales.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    question: '¿Puedo eliminar mi cuenta y mis datos?',
    answer:
      'Sí. Si deseas eliminar tu cuenta y todos tus datos personales, puedes contactarnos y procesaremos tu solicitud. Ten en cuenta que las validaciones que hayas realizado permanecerán en el sistema de forma anónima para mantener la integridad de los datos, pero tu información personal será eliminada.',
    icon: <Lock className="h-5 w-5" />,
  },
  {
    question: '¿Es segura la plataforma?',
    answer:
      'Sí. Utilizamos Supabase como proveedor de autenticación e infraestructura, que cumple con estándares de seguridad de la industria. Todas las conexiones están cifradas con HTTPS, y tus datos están protegidos con Row Level Security (RLS) en la base de datos. Además, el código fuente es abierto y puede ser auditado por cualquier persona.',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    question: '¿Quién está detrás de este proyecto?',
    answer:
      'Actas Abiertas es un proyecto de observación ciudadana independiente, sin afiliación a ningún partido político o candidato. Nuestro único objetivo es proporcionar transparencia y datos verificables sobre el proceso electoral. El código fuente está disponible públicamente en GitHub.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    question: '¿Los datos de las actas serán públicos?',
    answer:
      'Sí, tenemos planes de liberar una versión de solo lectura de la base de datos de actas validadas para que el público pueda usar los datos para sus propias investigaciones, análisis o proyectos. Esta versión NO incluirá ningún dato personal de los usuarios, solo los valores de las actas ya verificadas. Anunciaremos cuando esto esté disponible.',
    icon: <Globe className="h-5 w-5" />,
  },
]

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0069b4]/10 text-[#0069b4] flex items-center justify-center">
          {item.icon}
        </div>
        <span className="flex-1 font-medium text-base">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-5 pl-[4.5rem] text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0069b4]/10 text-[#0069b4] mb-2">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Preguntas Frecuentes</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Encuentra respuestas a las preguntas más comunes sobre la plataforma, tu privacidad y cómo
          funciona el sistema de validación.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="max-w-2xl mx-auto space-y-3">
        {faqItems.map((item, index) => (
          <FAQAccordionItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

      {/* Contact section */}
      <div className="max-w-2xl mx-auto">
        <div className="border rounded-xl p-6 bg-muted/30 text-center space-y-3">
          <h2 className="font-semibold text-lg">¿No encontraste lo que buscabas?</h2>
          <p className="text-muted-foreground text-sm">
            Si tienes alguna otra pregunta o sugerencia, no dudes en contactarnos a través de
            nuestro repositorio en GitHub.
          </p>
          <a
            href="https://github.com/jrangulo/actas-abiertas/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#0069b4] hover:underline font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.835 2.807 1.305 3.49.998.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.33-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.535-1.525.125-3.18 0 0 1.005-.32 3.3-.995.96.26 1.98.39 3 .39.995 0 2.01-.13 3-.39 2.295.675 3.3 1 3.3 1 .66 1.655.26 2.877.12 3.18.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.625-5.475 5.92.43.37.82 1.1.82 2.22 0 1.605-.015 2.89-.015 3.26 0 .32.21.69.82.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
            </svg>
            Abrir un issue en GitHub
          </a>
          <div className="pt-4 text-xs text-muted-foreground">
            <a href="/privacidad" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </a>
            {' · '}
            <a href="/terminos" className="hover:text-foreground transition-colors">
              Términos de Servicio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
