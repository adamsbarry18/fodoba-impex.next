import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { AuditLog } from "@/lib/types"
import { UserService } from "./user.service"
import { formatAuditPerformer } from "@/lib/audit-utils"

const COLLECTION_NAME = "audit_logs"

export const AuditService = {
  async listLogs(pageSize = 50, lastVisible?: DocumentSnapshot) {
    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(pageSize)
    )

    if (lastVisible) {
      q = query(q, startAfter(lastVisible))
    }

    const snap = await getDocs(q)
    const logs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AuditLog
    )

    return {
      logs: await this.enrichPerformerNames(logs),
      lastVisible: snap.docs[snap.docs.length - 1],
    }
  },

  async enrichPerformerNames(logs: AuditLog[]): Promise<AuditLog[]> {
    const missingUids = [
      ...new Set(
        logs
          .filter(
            (l) =>
              !l.performedByName &&
              l.performedBy &&
              l.performedBy !== "system"
          )
          .map((l) => l.performedBy)
      ),
    ]

    const nameMap: Record<string, string> = {}
    await Promise.all(
      missingUids.map(async (uid) => {
        const user = await UserService.getUser(uid)
        if (user) nameMap[uid] = `${user.prenom} ${user.nom}`
      })
    )

    return logs.map((log) => ({
      ...log,
      performedByName: formatAuditPerformer({
        performedBy: log.performedBy,
        performedByName:
          log.performedByName || nameMap[log.performedBy] || undefined,
      }),
    }))
  },
}
