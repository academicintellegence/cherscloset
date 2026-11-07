// Validates req.body against a zod schema and replaces it with the parsed value.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues[0]?.message || 'Invalid input';
    return res.status(400).json({ error: message });
  }
  req.body = result.data;
  next();
};
