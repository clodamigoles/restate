import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';

// Proxy côté serveur pour télécharger des images externes sans CORS.
// Utilisé uniquement par la page d'import admin.

async function proxyHandler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { url } = req.query;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'URL invalide' });
  }

  // Refus basique des adresses privées (SSRF)
  try {
    const { hostname } = new URL(url);
    if (/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      return res.status(403).json({ error: 'URL non autorisée' });
    }
  } catch {
    return res.status(400).json({ error: 'URL malformée' });
  }

  let response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
        Referer: new URL(url).origin + '/',
      },
    });
    clearTimeout(timeout);
  } catch (e) {
    return res.status(422).json({ error: e.message });
  }

  if (!response.ok) return res.status(response.status).end();

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'Réponse non-image' });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
}

async function handler(req, res) {
  return withAdminOrAuth(proxyHandler)(req, res);
}

export default errorHandler(handler);
