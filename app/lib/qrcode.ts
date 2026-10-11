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

export async function genererTokenBillet(
  billetId: string,
  evenementId: string,
): Promise<string> {
  return jwt.sign(
    {
      billetId,
      evenementId,
    },
    getJwtSecret(),
    {
      expiresIn: "90d",
    },
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
