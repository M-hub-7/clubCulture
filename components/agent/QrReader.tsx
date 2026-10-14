"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Icon } from "@/components/ui";

/** Le même QR n'est relu qu'après ce délai ; un QR différent passe tout de suite. */
const DEBOUNCE_MS = 3000;

/** Lecteur QR par caméra (html5-qrcode, chargé à la demande). */
export default function QrReader({ onScan }: { onScan: (token: string) => void }) {
  const [active, setActive] = useState(false);
  const [erreur, setErreur] = useState("");
  const callback = useRef(onScan);
  const dernier = useRef({ texte: "", t: 0 });

  useEffect(() => {
    callback.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;
    let scanner: Html5Qrcode | undefined;
    let annule = false;

    (async () => {
      if (!window.isSecureContext) {
        setErreur(
          "La caméra exige une connexion sécurisée (HTTPS). Utilisez la saisie manuelle ou l'adresse HTTPS du site.",
        );
        setActive(false);
        return;
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      if (annule) return;
      scanner = new Html5Qrcode("reader");
      await scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (texte) => {
            const now = Date.now();
            const d = dernier.current;
            if (texte === d.texte && now - d.t < DEBOUNCE_MS) return;
            dernier.current = { texte, t: now };
            callback.current(texte);
          },
          undefined,
        )
        .catch((e: unknown) => {
          setErreur(
            `Caméra indisponible : ${e instanceof Error ? e.message : String(e)}. Vérifiez l'autorisation d'accès à la caméra.`,
          );
          setActive(false);
        });
    })();

    return () => {
      annule = true;
      const s = scanner;
      if (s?.isScanning) void s.stop().then(() => s.clear());
    };
  }, [active]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-black">
        {active ? (
          <div id="reader" />
        ) : (
          <button
            onClick={() => {
              setErreur("");
              setActive(true);
            }}
            className="flex h-64 w-full flex-col items-center justify-center gap-2 text-on-surface-muted"
          >
            <Icon n="qr_code_scanner" className="!text-5xl text-accent-amber" />
            Activer la caméra
          </button>
        )}
      </div>
      {erreur && <p className="text-xs text-error">{erreur}</p>}
      {active && (
        <button onClick={() => setActive(false)} className="btn-ghost w-full">
          Arrêter la caméra
        </button>
      )}
    </>
  );
}
