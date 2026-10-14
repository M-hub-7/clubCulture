"use client";

import Guard from "@/components/layout/Guard";
import ScannerPanel from "@/components/agent/ScannerPanel";

export default function ScanPage() {
  return (
    <Guard roles={["AGENT", "ADMIN"]}>
      <ScannerPanel />
    </Guard>
  );
}
