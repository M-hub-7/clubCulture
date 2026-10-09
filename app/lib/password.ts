export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export interface PasswordValidationResult {
  valide: boolean;
  erreur?: string;
}

function normaliser(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function compact(value: string): string {
  return normaliser(value).replace(/[^a-z0-9]/g, "");
}

function partiesNom(nom: string): string[] {
  return normaliser(nom)
    .split(/[\s-]+/)
    .map(compact)
    .filter((part) => part.length >= 3);
}

export function validerMotDePasse(
  password: string,
  nom?: string | null,
  email?: string | null,
): PasswordValidationResult {
  if (!password) return { valide: false, erreur: "Le mot de passe est obligatoire." };
  if (password.length < 8) return { valide: false, erreur: "Au moins 8 caractères sont requis." };
  if (!/[a-z]/.test(password)) return { valide: false, erreur: "Ajoutez au moins une lettre minuscule." };
  if (!/[A-Z]/.test(password)) return { valide: false, erreur: "Ajoutez au moins une lettre majuscule." };
  if (!/\d/.test(password)) return { valide: false, erreur: "Ajoutez au moins un chiffre." };
  if (!/[^A-Za-z\d]/.test(password)) return { valide: false, erreur: "Ajoutez au moins un caractère spécial." };

  const compactPassword = compact(password);

  if (nom?.trim()) {
    const normalizedName = compact(nom);
    if (normalizedName.length >= 3 && compactPassword.includes(normalizedName)) {
      return { valide: false, erreur: "Le mot de passe ne doit pas contenir votre nom." };
    }
    for (const part of partiesNom(nom)) {
      if (compactPassword.includes(part)) {
        return { valide: false, erreur: "Le mot de passe ne doit pas contenir votre nom ou votre prénom." };
      }
    }
  }

  if (email?.trim()) {
    const localPart = email.trim().toLowerCase().split("@")[0] ?? "";
    const normalizedEmail = compact(localPart);
    if (normalizedEmail.length >= 3 && compactPassword.includes(normalizedEmail)) {
      return { valide: false, erreur: "Le mot de passe ne doit pas contenir votre identifiant email." };
    }
  }

  return { valide: true };
}
