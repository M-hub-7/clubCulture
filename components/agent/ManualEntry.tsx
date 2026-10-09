"use client";

import { useState, type FormEvent } from "react";

/** Saisie manuelle du token d'un billet (si le QR code est illisible). */
export default function ManualEntry({ onSend }: { onSend: (token: string) => void }) {
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input"
        placeholder="Saisie manuelle du token"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn">OK</button>
    </form>
  );
}
