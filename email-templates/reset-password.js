import { emailLayout } from './layout';

export function resetPasswordEmail({ name, resetUrl }) {
  return {
    subject: 'Maxo Destinations — Réinitialisation de votre mot de passe',
    html: emailLayout({
      title: 'Réinitialisation du mot de passe',
      preheader: 'Vous avez demandé à réinitialiser votre mot de passe Maxo Destinations.',
      content: `
        <h2>Réinitialiser votre mot de passe</h2>
        <p>Bonjour ${name},</p>
        <p>Nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte Maxo Destinations. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
        <p style="text-align:center;">
          <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
        </p>
        <p>Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe restera inchangé.</p>
        <p style="font-size:13px;color:#a1a1aa;">Si le bouton ne fonctionne pas&nbsp;:<br>${resetUrl}</p>
      `,
    }),
  };
}
