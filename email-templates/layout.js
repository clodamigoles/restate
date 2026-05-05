/**
 * Layout HTML commun pour tous les emails.
 * @param {object} opts - { title, preheader, content }
 */
export function emailLayout({ title, preheader = '', content }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { background: #1d4ed8; padding: 24px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 32px; }
    .body h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
    .body p { margin: 0 0 16px; line-height: 1.6; color: #52525b; }
    .btn { display: inline-block; background: #1d4ed8; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 16px; }
    .info-box { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #71717a; }
    .info-row .value { font-weight: 500; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0 0; font-size: 16px; font-weight: 700; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-warning { background: #fef9c3; color: #ca8a04; }
    .footer { padding: 20px 32px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <div class="wrapper">
    <div class="header">
      <h1>Maxo Destinations</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Maxo Destinations — Location courte durée</p>
      <p>Vous recevez cet email car vous avez un compte sur Maxo Destinations.</p>
    </div>
  </div>
</body>
</html>`;
}
