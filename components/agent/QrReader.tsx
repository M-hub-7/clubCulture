"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Icon } from "@/components/ui";

const DEBOUNCE_MS = 2500;

/** Lecteur QR par caméra (html5-qrcode, chargé à la demande) avec anti-rebond de 2,5 s. */
export default function QrReader({ onScan }: { onScan: (token: string) => void }) {
  const [active, setActive] = useState(false);
  const callback = useRef(onScan);
  const lastScan = useRef(0);
  callback.current = onScan;

  useEffect(() => {
    if (!active) return;
    let scanner: Html5Qrcode | undefined;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      scanner = new Html5Qrcode("reader");
      await scanner
        .start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, (text) => {
          if (Date.now() - lastScan.current > DEBOUNCE_MS) {
            lastScan.current = Date.now();
            callback.current(text);
          }
        }, undefined)
        .catch(() => setActive(false));
    })();

    return () => {
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
            onClick={() => setActive(true)}
            className="flex h-64 w-full flex-col items-center justify-center gap-2 text-on-surface-muted"
          >
            <Icon n="qr_code_scanner" className="!text-5xl text-accent-amber" />
            Activer la caméra
          </button>
        )}
      </div>
      {active && (
        <button onClick={() => setActive(false)} className="btn-ghost w-full">
          Arrêter la caméra
        </button>
      )}
    </>
  );
}
