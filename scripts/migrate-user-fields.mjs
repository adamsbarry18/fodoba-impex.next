/**
 * Migrate users collection field names FR → EN (idempotent).
 *
 * Mapping:
 *   prenom → firstName
 *   nom → lastName
 *   actif → active
 *   boutiqueIds → storeIds
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/migrate-user-fields.mjs
 *
 * Dry run (no writes):
 *   DRY_RUN=1 GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/migrate-user-fields.mjs
 *
 * Order:
 *   1. Run this migration on Firestore
 *   2. Deploy firestore.rules + the app that expects English field names
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app"
import { FieldValue, getFirestore } from "firebase-admin/firestore"

const FIELD_MAP = [
  ["prenom", "firstName"],
  ["nom", "lastName"],
  ["actif", "active"],
  ["boutiqueIds", "storeIds"],
]

function initApp() {
  if (getApps().length > 0) return

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    const absolute = resolve(credPath)
    if (!existsSync(absolute)) {
      throw new Error(
        `Service account file not found: ${absolute}\n` +
          `Place your Firebase service account JSON there, or fix GOOGLE_APPLICATION_CREDENTIALS.`
      )
    }
    const serviceAccount = JSON.parse(readFileSync(absolute, "utf8"))
    initializeApp({
      credential: cert(serviceAccount),
      projectId:
        process.env.GCLOUD_PROJECT ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        serviceAccount.project_id,
    })
    return
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
  })
}

async function migrate() {
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true"

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_PROJECT) {
    console.error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json (path to your Firebase service account JSON)."
    )
    process.exit(1)
  }

  initApp()
  const db = getFirestore()

  const snap = await db.collection("users").get()
  console.log(`Found ${snap.size} user document(s).${dryRun ? " (dry run)" : ""}`)

  let migrated = 0
  let skipped = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const updates = {}
    const deletes = []

    for (const [from, to] of FIELD_MAP) {
      const hasOld = Object.prototype.hasOwnProperty.call(data, from)
      const hasNew = Object.prototype.hasOwnProperty.call(data, to)

      if (hasOld) {
        if (!hasNew) {
          updates[to] = data[from]
        }
        deletes.push(from)
      }
    }

    if (Object.keys(updates).length === 0 && deletes.length === 0) {
      skipped++
      continue
    }

    console.log(
      `- ${doc.id}: set ${Object.keys(updates).join(", ") || "(none)"}; delete ${deletes.join(", ") || "(none)"}`
    )

    if (!dryRun) {
      const payload = { ...updates }
      for (const key of deletes) {
        payload[key] = FieldValue.delete()
      }
      await doc.ref.update(payload)
    }
    migrated++
  }

  console.log(
    `Done. migrated=${migrated} skipped=${skipped}${dryRun ? " (dry run, no writes)" : ""}`
  )
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
