import { Resend } from "resend";

const echapperHtml = (texte: string) =>
  texte.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

interface EmailReinitialisationParams {
  email: string;
  nom?: string | null;
  resetUrl: string;
}

export async function envoyerEmailReinitialisation({
  email,
  nom,
  resetUrl,
}: EmailReinitialisationParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante");
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL || "Club Culture <onboarding@resend.dev>",

    to: [email],

    subject: "Réinitialisation de votre mot de passe Club Culture",

    html: `
      <h1>Club Culture</h1>

      <p>Bonjour ${echapperHtml(nom || "")},</p>

      <p>
        Vous avez demandé à réinitialiser votre mot de passe. Ce lien est
        valable pour une durée limitée :
      </p>

      <p>
        <a href="${echapperHtml(resetUrl)}">
          Réinitialiser mon mot de passe
        </a>
      </p>

      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    `,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend n'a retourné aucun ID d'email.");
  }

  return result.data.id;
}
