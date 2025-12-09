export function getUserName(rawUserMetaData: unknown): string {
  if (rawUserMetaData && typeof rawUserMetaData === 'object') {
    const metadata = rawUserMetaData as Record<string, unknown>

    // Intentar obtener el nombre completo
    if (metadata.full_name && typeof metadata.full_name === 'string') {
      return metadata.full_name
    }

    // Intentar obtener nombre y apellido por separado
    const firstName = metadata.name || metadata.first_name || ''
    const lastName = metadata.last_name || metadata.surname || ''
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    // Si tiene email, usar la parte antes del @
    if (metadata.email && typeof metadata.email === 'string') {
      return metadata.email.split('@')[0]
    }
  }

  return 'Usuario Anónimo'
}
