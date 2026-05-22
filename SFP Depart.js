// ============================================================
// Copyright (c) 2026 Léo Ratsamy
// Licence MIT — voir LICENSE.txt
// Toute revendication de propriete par une institution est interdite
// sans accord ecrit explicite de l'auteur.
// ============================================================

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
const FM = FileManager.iCloud()
const BASE = FM.documentsDirectory()
const JSON_PATH = BASE + "/presences.json"
const EN_COURS_PATH = BASE + "/en_cours.txt"

function pad(n) { return String(n).padStart(2, "0") }

function fmt(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return h + "h"
  return h + "h" + String(m).padStart(2, "0")
}

async function run() {
  const now = new Date()

  if (!FM.fileExists(EN_COURS_PATH)) {
    let n = new Notification()
    n.title = "SFP - Erreur"
    n.body = "Pas d'arrivee enregistree !"
    await n.schedule()
    return
  }

  await FM.downloadFileFromiCloud(EN_COURS_PATH)
  const arriveeStr = FM.readString(EN_COURS_PATH).trim()
  const arriveeDate = new Date(arriveeStr)

  if (isNaN(arriveeDate.getTime())) {
    let n = new Notification()
    n.title = "SFP - Erreur"
    n.body = "Heure arrivee invalide"
    await n.schedule()
    return
  }

  const duree = Math.round((now - arriveeDate) / 60000)

  if (duree <= 0) {
    let n = new Notification()
    n.title = "SFP - Erreur"
    n.body = "Duree negative ou nulle"
    await n.schedule()
    return
  }

  const hArr = pad(arriveeDate.getHours()) + ":" + pad(arriveeDate.getMinutes())
  const hDep = pad(now.getHours()) + ":" + pad(now.getMinutes())
  const dateISO = arriveeDate.getFullYear() + "-"
    + pad(arriveeDate.getMonth() + 1) + "-"
    + pad(arriveeDate.getDate()) + "T" + hArr + ":00"

  const session = {
    date: dateISO,
    heure_arrivee: hArr,
    heure_depart: hDep,
    duree: duree
  }

  let data = { sessions: [] }
  if (FM.fileExists(JSON_PATH)) {
    await FM.downloadFileFromiCloud(JSON_PATH)
    try {
      const parsed = JSON.parse(FM.readString(JSON_PATH))
      if (parsed.sessions && Array.isArray(parsed.sessions)) {
        data = parsed
      }
    } catch(e) {}
  }

  data.sessions.push(session)
  FM.writeString(JSON_PATH, JSON.stringify(data))
  FM.writeString(EN_COURS_PATH, "")

  let n = new Notification()
  n.title = "Depart enregistre !"
  n.body = fmt(duree) + " ajoutees — " + hArr + " -> " + hDep
  await n.schedule()

  Script.complete()
}

await run()
