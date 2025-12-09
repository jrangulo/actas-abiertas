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

/**
 * Extraer la URL del avatar del metadata del usuario
 * Soporta Google (picture) y Facebook (avatar_url)
 */
export function getUserAvatarUrl(rawUserMetaData: unknown): string | null {
  if (rawUserMetaData && typeof rawUserMetaData === 'object') {
    const metadata = rawUserMetaData as Record<string, unknown>

    // Google usa 'picture', Facebook usa 'avatar_url'
    if (metadata.avatar_url && typeof metadata.avatar_url === 'string') {
      return metadata.avatar_url
    }
    if (metadata.picture && typeof metadata.picture === 'string') {
      return metadata.picture
    }
  }

  return null
}
