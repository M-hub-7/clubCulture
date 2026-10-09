import { Resend } from "resend";

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

  console.log("========== RESEND TEST ==========");
  console.log("API KEY présente :", !!apiKey);
  console.log("Destinataire :", email);
  console.log("=================================");

  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante");
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL || "Club Culture <onboarding@resend.dev>",

    to: [email],

    subject: "Test - Réinitialisation Club Culture",

    html: `
      <h1>Club Culture</h1>

      <p>Bonjour ${nom || "Utilisateur"},</p>

      <p>
        Ceci est un test de l'envoi d'email de récupération.
      </p>

      <p>
        <a href="${resetUrl}">
          Réinitialiser mon mot de passe
        </a>
      </p>
    `,
  });

  console.log("========== REPONSE RESEND ==========");
  console.log(JSON.stringify(result, null, 2));
  console.log("=====================================");

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend n'a retourné aucun ID d'email.");
  }

  return result.data.id;
}
