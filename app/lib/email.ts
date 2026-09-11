import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EnvoyerEmailBilletsParams {
  email: string;
  nom: string;
  commande: any;
  billets: any[];
}

export async function envoyerEmailBillets({
  email,
  nom,
  commande,
  billets,
}: EnvoyerEmailBilletsParams) {
  try {
    await resend.emails.send({
      from: "Club Culture <billets@clubculture.com>",
      to: email,
      subject: `🎫 Vos ${billets.length} billet(s) — Club Culture`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2E75B6; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎵 Club Culture</h1>
          </div>

          <div style="padding: 30px;">
            <h2>Bonjour ${nom} !</h2>
            <p>Votre paiement a été confirmé. Voici vos billets :</p>

            <div style="background: #E6F1FB; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Commande :</strong> ${commande.id}</p>
              <p><strong>Montant total :</strong> ${(commande.montantTotal / 100).toFixed(2)} €</p>
              <p><strong>Nombre de billets :</strong> ${billets.length}</p>
            </div>

            ${billets
              .map(
                (b) => `
              <div style="border: 2px solid #2E75B6; border-radius: 8px; padding: 20px; margin: 15px 0;">
                <h3 style="color: #2E75B6; margin-top: 0;">Billet #${b.numero}</h3>
                <p><strong>Porteur :</strong> ${b.nomPorteur}</p>
                <p><strong>Token :</strong> <code style="background: #f0f0f0; padding: 4px 8px;">${b.token}</code></p>
                <p style="color: #666; font-size: 12px;">Présentez ce code QR à l'entrée de l'événement</p>
              </div>
            `,
              )
              .join("")}

            <p style="color: #666; margin-top: 30px;">
              Merci de votre confiance !<br>
              <strong>L'équipe Club Culture</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log(`📧 Email envoyé à ${email}`);
  } catch (error) {
    // L'email est non bloquant — on log l'erreur sans faire échouer le webhook
    console.error("Erreur envoi email:", error);
  }
}
