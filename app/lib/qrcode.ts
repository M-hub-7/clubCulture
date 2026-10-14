import jwt from "jsonwebtoken";
import QRCode from "qrcode";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET n'est pas configuré.");
  }

  return secret;
}

export interface BilletTokenPayload {
  billetId: string;
  evenementId: string;
}

/** Le QR reste valable jusqu'à 7 jours après la fin de l'événement (90 jours si inconnue). */
export async function genererTokenBillet(
  billetId: string,
  evenementId: string,
  finEvenement?: Date,
): Promise<string> {
  const expiresIn = finEvenement
    ? Math.max(
        60,
        Math.floor((finEvenement.getTime() - Date.now()) / 1000) + 7 * 24 * 3600,
      )
    : "90d";

  return jwt.sign(
    {
      billetId,
      evenementId,
    },
    getJwtSecret(),
    { expiresIn },
  );
}

export async function genererQRCode(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
  });
}

export function verifierTokenBillet(token: string): BilletTokenPayload {
  const payload = jwt.verify(token, getJwtSecret());

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.billetId !== "string" ||
    typeof payload.evenementId !== "string"
  ) {
    throw new Error("Token de billet invalide.");
  }

  return {
    billetId: payload.billetId,
    evenementId: payload.evenementId,
  };
}
