import formidable from 'formidable';
import fs from 'fs';
import { put } from '@vercel/blob';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';

export const config = {
  api: { bodyParser: false },
};

// Images are compressed client-side before upload — keep a generous safety limit
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024; // 20 MB

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  const form = formidable({
    keepExtensions: true,
    maxFileSize: MAX_SIZE,
    maxFiles: 100,
  });

  const [, files] = await form.parse(req);

  const fileList = files.images || files.file || [];
  const arr = (Array.isArray(fileList) ? fileList : [fileList]).filter(
    (f) => f && f.mimetype && f.mimetype.startsWith('image/')
  );

  const uploaded = [];

  for (const file of arr) {
    if (!file) continue;

    const buffer = fs.readFileSync(file.filepath);
    const filename = `listings/${Date.now()}-${file.originalFilename || 'image'}`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.mimetype,
    });

    uploaded.push(blob.url);

    // Nettoyage du fichier temporaire
    fs.unlink(file.filepath, () => {});
  }

  if (uploaded.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun fichier valide recu' });
  }

  // Retrocompat : le form attend { url } (premier fichier) ou { data: [...] }
  return res.status(200).json({ success: true, url: uploaded[0], data: uploaded });
}

export default errorHandler(withAdminOrAuth(handler));
