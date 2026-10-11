"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scanService } from "./services";
import type { ScanResponse, ScanStatsData } from "@/types";

const EVENT_KEY = "cc_ev";
const QUEUE_KEY = "cc_queue";

/**
 * Logique du scan : événement courant, statistiques, dernier résultat
 * et file d'attente hors ligne persistée dans le navigateur.
 */
export function useScanner() {
  const [evId, setEvIdState] = useState("");
  const [res, setRes] = useState<ScanResponse | null>(null);
  const [stats, setStats] = useState<ScanStatsData | null>(null);
  const [queue, setQueueState] = useState<string[]>([]);

  // Refs : valeurs lues dans des callbacks (QR reader, événement "online").
  const evRef = useRef("");
  const queueRef = useRef<string[]>([]);

  const setQueue = (next: string[]) => {
    queueRef.current = next;
    setQueueState(next);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  };

  const refresh = useCallback(async () => {
    if (!evRef.current) return;
    try {
      setStats(await scanService.stats(evRef.current));
    } catch {
      /* statistiques indisponibles : on ignore */
    }
  }, []);

  const setEvId = (value: string) => {
    evRef.current = value;
    setEvIdState(value);
    localStorage.setItem(EVENT_KEY, value);
  };

  // Restauration de l'événement et de la file au chargement.
  useEffect(() => {
    const saved = localStorage.getItem(EVENT_KEY);
    if (saved) {
      evRef.current = saved;
      setEvIdState(saved);
      void refresh();
    }
    try {
      queueRef.current = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as string[];
      setQueueState(queueRef.current);
    } catch {
      /* file corrompue : on repart de zéro */
    }
  }, [refresh]);

  const send = useCallback(
    async (token: string, horsLigne = false) => {
      if (!evRef.current) {
        setRes({ message: "Saisissez d'abord l'ID de l'événement.", couleur: "ROUGE" });
        return;
      }
      if (!navigator.onLine) {
        setQueue([...queueRef.current, token]);
        setRes({ message: "Hors ligne — scan mis en attente.", couleur: "ORANGE" });
        return;
      }
      try {
        setRes(await scanService.scan(token, evRef.current, horsLigne));
        void refresh();
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status) setRes({ message: (e as Error).message, couleur: "ROUGE" });
        else setQueue([...queueRef.current, token]); // erreur réseau → on met en attente
      }
    },
    [refresh],
  );

  /** Rejoue les scans en attente (appelé au retour de la connexion). */
  const flush = useCallback(async () => {
    const items = queueRef.current;
    setQueue([]);
    for (const token of items) await send(token, true);
  }, [send]);

  useEffect(() => {
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  return { evId, setEvId, res, stats, queue, send, flush, refresh };
}
