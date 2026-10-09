const STEPS = ["Billets", "Paiement", "Confirmation"];

export default function CheckoutSteps({ current }: { current: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
      {STEPS.map((step, i) => {
        const reached = i + 1 <= current;
        return (
          <span
            key={step}
            className={`flex items-center gap-2 ${reached ? "text-accent-amber" : "text-on-surface-muted"}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                reached ? "bg-accent-amber text-[#452b00]" : "bg-surface-high"
              }`}
            >
              {i + 1}
            </span>
            {step}
            {i < STEPS.length - 1 && <span className="mx-2 h-px w-8 bg-outline-variant" />}
          </span>
        );
      })}
    </div>
  );
}
