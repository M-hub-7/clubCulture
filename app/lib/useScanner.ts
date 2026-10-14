"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";
import { scanService } from "./services";
import {
  evenementDuQr,
  scanStore,
  sha256Hex,
  type BilletManifeste,
  type Manifeste,
} from "./scanStore";
import type { EvenementScan, ScanResponse } from "@/types";

const EVENT_KEY = "cc_ev";
const LEGACY_QUEUE_KEY = "cc_queue";
/** Synchronisation de la file et rafraîchissement de la liste, en ligne. */
const INTERVALLE_MS = 60_000;

export interface ConflitScan {
  porteur?: string;
  resultat: string;
  message: string;
  scanneA: string;
}

export interface StatsScan {
  entres: number;
  total: number;
}

const VIBRATIONS: Record<ScanResponse["couleur"], number[]> = {
  VERT: [80],
  ORANGE: [80, 60, 80],
  ROUGE: [400],
};

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const estErreurReseau = (e: unknown) => !(e instanceof ApiError);

function statsDe(m: Manifeste | null): StatsScan | null {
  if (!m) return null;
  let entres = 0;
  let total = 0;
  for (const b of m.billets) {
    if (b.statut === "UTILISE") entres++;
    if (b.statut === "UTILISE" || b.statut === "VALIDE") total++;
  }
  return { entres, total };
}

/**
 * Logique du scan.
 *
 * En ligne : chaque QR est vérifié par le serveur (source de vérité).
 * Hors ligne : il est vérifié contre la liste des billets téléchargée
 * (empreintes SHA-256), marqué utilisé localement et mis en file ;
 * la file est rejouée au retour du réseau et les conflits sont signalés.
 */
export function useScanner() {
  const [evenements, setEvenements] = useState<EvenementScan[] | null>(null);
  const [evId, setEvIdState] = useState("");
  const [manifeste, setManifesteState] = useState<Manifeste | null>(null);
  const [res, setRes] = useState<ScanResponse | null>(null);
  const [enLigne, setEnLigne] = useState(true);
  const [enAttente, setEnAttente] = useState(0);
  const [conflits, setConflits] = useState<ConflitScan[]>([]);
  const [synchro, setSynchro] = useState(false);

  // Refs lues depuis les callbacks (lecteur QR, événements réseau, minuteur)
  const evRef = useRef("");
  const manifesteRef = useRef<Manifeste | null>(null);
  const indexRef = useRef(new Map<string, BilletManifeste>());
  const synchroRef = useRef(false);

  const setManifeste = (m: Manifeste | null) => {
    manifesteRef.current = m;
    indexRef.current = new Map(m?.billets.map((b) => [b.h, b]));
    setManifesteState(m);
  };

  const compterFile = useCallback(async () => {
    const file = await scanStore.lireFile();
    setEnAttente(file.length);
    return file;
  }, []);

  const afficher = (r: ScanResponse) => {
    setRes(r);
    navigator.vibrate?.(VIBRATIONS[r.couleur] ?? VIBRATIONS.ROUGE);
  };

  /** Met à jour le statut d'un billet dans la liste locale (et IndexedDB). */
  const marquer = useCallback(async (h: string, statut: BilletManifeste["statut"]) => {
    const m = manifesteRef.current;
    const billet = indexRef.current.get(h);
    if (!m || !billet || billet.statut === statut) return;
    billet.statut = statut;
    setManifesteState({ ...m });
    await scanStore.ecrireManifeste(m);
  }, []);

  /** Télécharge la liste des billets ; les passages encore en file restent « utilisés ». */
  const actualiser = useCallback(async () => {
    const id = evRef.current;
    if (!id) return;
    try {
      const frais = await scanService.manifest(id);
      const file = await scanStore.lireFile();
      const locaux = new Set(
        file.filter((s) => s.evenementId === id).map((s) => sha256Hex(s.token)),
      );
      for (const b of frais.billets) {
        if (locaux.has(b.h) && b.statut === "VALIDE") b.statut = "UTILISE";
      }
      if (evRef.current !== id) return; // l'agent a changé d'événement entre-temps
      await scanStore.ecrireManifeste(frais);
      setManifeste(frais);
    } catch {
      /* hors ligne ou erreur : on garde la liste locale */
    }
  }, []);

  /** Rejoue les scans hors ligne. S'arrête à la première coupure réseau. */
  const synchroniser = useCallback(async () => {
    if (synchroRef.current || !navigator.onLine) return;
    synchroRef.current = true;
    setSynchro(true);
    const nouveaux: ConflitScan[] = [];
    try {
      for (const scan of await scanStore.lireFile()) {
        try {
          const r = await scanService.scan(scan.token, scan.evenementId, true, scan.scanneA);
          if (r.resultat !== "VALIDE") {
            nouveaux.push({
              porteur: indexRef.current.get(sha256Hex(scan.token))?.porteur,
              resultat: r.resultat ?? "ERREUR",
              message: r.message,
              scanneA: scan.scanneA,
            });
          }
        } catch (e) {
          if (estErreurReseau(e) || (e as ApiError).status === 401) break;
          nouveaux.push({
            resultat: "ERREUR",
            message: (e as Error).message,
            scanneA: scan.scanneA,
          });
        }
        await scanStore.retirerDeLaFile(scan.id!);
      }
    } finally {
      synchroRef.current = false;
      setSynchro(false);
      if (nouveaux.length) setConflits((c) => [...nouveaux, ...c]);
      await compterFile();
    }
    await actualiser();
  }, [actualiser, compterFile]);

  const choisirEvenement = useCallback(
    async (id: string) => {
      evRef.current = id;
      setEvIdState(id);
      setRes(null);
      try {
        localStorage.setItem(EVENT_KEY, id);
      } catch {
        /* stockage indisponible */
      }
      setManifeste(id ? ((await scanStore.lireManifeste(id)) ?? null) : null);
      if (id && navigator.onLine) await actualiser();
    },
    [actualiser],
  );

  /** Verdict sans réseau, à partir de la liste téléchargée. */
  const verifierHorsLigne = async (token: string, h: string) => {
    const m = manifesteRef.current;
    const scanneA = new Date().toISOString();

    if (!m) {
      await scanStore.ajouterALaFile({ token, evenementId: evRef.current, scanneA });
      await compterFile();
      return afficher({
        message:
          "Hors ligne et liste des billets non téléchargée : contrôle impossible, scan mis en attente.",
        couleur: "ORANGE",
        horsLigne: true,
      });
    }

    const billet = indexRef.current.get(h);
    const info = billet && {
      numero: billet.numero,
      porteur: billet.porteur,
      categorie: billet.categorie,
    };

    if (!billet) {
      const autre = evenementDuQr(token);
      return afficher(
        autre && autre !== evRef.current
          ? {
              resultat: "MAUVAIS_EVENEMENT",
              message: "Ce billet n'est pas pour cet événement",
              couleur: "ROUGE",
              horsLigne: true,
            }
          : {
              resultat: "INVALIDE",
              message: `Billet inconnu de la liste du ${heure(m.genereA)}. Réessayez une fois en ligne s'il vient d'être validé.`,
              couleur: "ROUGE",
              horsLigne: true,
            },
      );
    }

    if (billet.statut === "UTILISE") {
      return afficher({
        resultat: "DEJA_UTILISE",
        message: "Billet déjà utilisé",
        couleur: "ORANGE",
        billet: info,
        horsLigne: true,
      });
    }

    if (billet.statut !== "VALIDE") {
      return afficher({
        resultat: "REMBOURSE",
        message: "Ce billet a été remboursé, annulé ou refusé",
        couleur: "ROUGE",
        billet: info,
        horsLigne: true,
      });
    }

    await marquer(h, "UTILISE");
    await scanStore.ajouterALaFile({ token, evenementId: evRef.current, scanneA });
    await compterFile();
    afficher({
      resultat: "VALIDE",
      message: "Billet valide — Entrée autorisée (hors ligne)",
      couleur: "VERT",
      billet: info,
      horsLigne: true,
    });
  };

  const send = async (brut: string) => {
    const token = brut.trim();
    if (!token) return;
    if (!evRef.current) {
      return afficher({ message: "Choisissez d'abord l'événement.", couleur: "ROUGE" });
    }
    const h = sha256Hex(token);

    if (navigator.onLine) {
      try {
        const r = await scanService.scan(token, evRef.current);
        afficher(r);
        if (r.resultat === "VALIDE" || r.resultat === "DEJA_UTILISE") {
          await marquer(h, "UTILISE");
        }
        return;
      } catch (e) {
        if (!estErreurReseau(e)) {
          return afficher({ message: (e as Error).message, couleur: "ROUGE" });
        }
        // Réseau tombé pendant la requête : on bascule sur le contrôle local
      }
    }
    await verifierHorsLigne(token, h);
  };

  // Chargement initial : événement mémorisé, file, ancienne file localStorage
  useEffect(() => {
    void (async () => {
      setEnLigne(navigator.onLine);
      let saved = "";
      try {
        saved = localStorage.getItem(EVENT_KEY) ?? "";
        const ancienne = JSON.parse(localStorage.getItem(LEGACY_QUEUE_KEY) ?? "[]") as string[];
        if (saved && ancienne.length) {
          const maintenant = new Date().toISOString();
          for (const token of ancienne) {
            await scanStore.ajouterALaFile({ token, evenementId: saved, scanneA: maintenant });
          }
        }
        localStorage.removeItem(LEGACY_QUEUE_KEY);
      } catch {
        /* stockage indisponible ou file corrompue */
      }
      await compterFile();
      scanService
        .events()
        .then(setEvenements)
        .catch(() => setEvenements([]));
      if (saved) await choisirEvenement(saved);
      void synchroniser();
    })();
  }, [choisirEvenement, compterFile, synchroniser]);

  // Réseau : synchronisation au retour, puis toutes les minutes
  useEffect(() => {
    const online = () => {
      setEnLigne(true);
      void synchroniser();
    };
    const offline = () => setEnLigne(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    const timer = window.setInterval(() => {
      if (navigator.onLine) void synchroniser();
    }, INTERVALLE_MS);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.clearInterval(timer);
    };
  }, [synchroniser]);

  return {
    evenements,
    evId,
    choisirEvenement,
    manifeste,
    stats: statsDe(manifeste),
    res,
    send,
    enLigne,
    enAttente,
    synchro,
    synchroniser,
    actualiser,
    conflits,
    effacerConflits: () => setConflits([]),
  };
}
