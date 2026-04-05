export function errorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ success: false, error: messages.join(', ') });
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({ success: false, error: `Ce ${field} est déjà utilisé` });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({ success: false, error: 'ID invalide' });
      }

      return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur',
      });
    }
  };
}
