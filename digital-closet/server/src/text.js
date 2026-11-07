import { z } from 'zod';

// User-typed labels: drop control characters and angle brackets, collapse whitespace.
// React already escapes output; this keeps stored data clean for exports, logs and other consumers.
export const cleanString = (max, emptyMsg = 'This field is required') =>
  z
    .string()
    .max(max * 4)
    .transform((s) => s.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim())
    .pipe(z.string().min(1, emptyMsg).max(max));
