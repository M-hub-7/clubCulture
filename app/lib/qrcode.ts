import jwt from "jsonwebtoken";
import QRCode from "qrcode";

export async function genererTokenBillet(
  billetId: string,
  evenementId: string,
): Promise<string> {
  return jwt.sign({ billetId, evenementId }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
}

export async function genererQRCode(token: string): Promise<string> {
  return QRCode.toDataURL(token);
}

export function verifierTokenBillet(token: string): {
  billetId: string;
  evenementId: string;
} {
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    billetId: string;
    evenementId: string;
  };
}
