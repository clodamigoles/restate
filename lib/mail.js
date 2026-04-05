import nodemailer from 'nodemailer';

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    // En dev sans SMTP configuré : Ethereal (emails captés, pas envoyés)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[MAIL] Mode Ethereal — prévisualisez les emails sur https://ethereal.email');
    console.log('[MAIL] Login:', testAccount.user, '| Pass:', testAccount.pass);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Envoie un email.
 * @param {object} opts - { to, subject, html, text? }
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"Restate" <${process.env.SMTP_FROM || 'noreply@restate.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });

    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[MAIL] Prévisualisation : ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAIL] Erreur envoi email:', error.message);
    // On ne fait pas planter l'app si l'email échoue
    return { success: false, error: error.message };
  }
}
