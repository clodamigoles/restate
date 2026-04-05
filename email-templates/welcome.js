import { emailLayout } from './layout';

export function welcomeEmail({ name, verifyUrl }) {
  return {
    subject: 'Bienvenue sur Restate — Vérifiez votre email',
    html: emailLayout({
      title: 'Bienvenue sur Restate',
      preheader: `Bonjour ${name}, vérifiez votre adresse email pour activer votre compte.`,
      content: `
        <h2>Bienvenue, ${name} !</h2>
        <p>Merci de vous être inscrit sur <strong>Restate</strong>. Pour activer votre compte et commencer à explorer nos annonces, veuillez vérifier votre adresse email.</p>
        <p style="text-align:center;">
          <a href="${verifyUrl}" class="btn">Vérifier mon email</a>
        </p>
        <p>Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        <p style="font-size:13px;color:#a1a1aa;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br>${verifyUrl}</p>
      `,
    }),
  };
}
