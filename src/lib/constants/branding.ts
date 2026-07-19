import frMessages from "@/i18n/messages/fr.json"
import { getNestedMessage, nestMessages } from "@/i18n/nest-messages"

export const APP_NAME_I18N_KEY = "common.appName"

const nestedFrMessages = nestMessages(frMessages)

/** Nom de l'application (PDF, exports hors composants React). */
export function getAppName(): string {
  return getNestedMessage(nestedFrMessages, APP_NAME_I18N_KEY) ?? "FODOBA BUSINESS"
}
