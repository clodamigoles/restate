import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant dans .env.local');
}

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  // Connexion déjà établie et toujours active
  if (cached.conn) {
    if (mongoose.connection.readyState === 1) return cached.conn;
    // La connexion a été perdue, on réinitialise
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    // Pas de bufferCommands: false — cette option crée une race condition au
    // démarrage : la Promise de connect() se résout avant que l'état interne
    // de Mongoose soit complètement prêt, ce qui fait échouer les premières
    // requêtes sur un cold start alors qu'elles devraient fonctionner.
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Réinitialiser pour permettre une nouvelle tentative à la prochaine requête
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
