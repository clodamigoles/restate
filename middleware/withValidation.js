export function withValidation(schema, handler) {
  return async (req, res) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rules.label || field} est requis`);
        continue;
      }

      if (value !== undefined && value !== '') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${rules.label || field} doit contenir au moins ${rules.minLength} caractères`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${rules.label || field} ne doit pas dépasser ${rules.maxLength} caractères`);
        }
        if (rules.match && !rules.match.test(value)) {
          errors.push(`${rules.label || field} est invalide`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    return handler(req, res);
  };
}
