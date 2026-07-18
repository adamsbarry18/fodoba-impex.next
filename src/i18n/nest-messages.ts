type MessageValue = string | Messages
type Messages = { [key: string]: MessageValue }

export type { Messages }

/**
 * Convertit un dictionnaire plat ("common.save") en arbre imbriqué
 * requis par next-intl v4+.
 */
export function nestMessages(flat: Record<string, string>): Messages {
  const result: Messages = {}

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".")
    let current = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const next = current[part]
      if (typeof next !== "object" || next === null) {
        current[part] = {}
      }
      current = current[part] as Messages
    }

    current[parts[parts.length - 1]] = value
  }

  return result
}

/** Résout une clé pointée ("payment.cash") dans un arbre de messages. */
export function getNestedMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".")
  let current: MessageValue | undefined = messages

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined
    current = current[part]
  }

  return typeof current === "string" ? current : undefined
}
