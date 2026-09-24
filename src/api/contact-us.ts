import { z } from 'zod';
import { ClientEnvironmentSchema, ReporterSchema } from './common.js';

export const ContactUsSchema = z.object({
    message: z.string().trim().min(1).max(5000),
    /** Omit when the user gave none (never send a placeholder like "No email provided"). */
    email: z.string().trim().pipe(z.email()).optional(),
    environment: ClientEnvironmentSchema,
    reporter: ReporterSchema,
    /** ISO 8601, e.g. `new Date().toISOString()`. */
    createdAt: z.iso.datetime({ offset: true }),
});
export type ContactUs = z.infer<typeof ContactUsSchema>;

/** Body of `POST /contact-us`. */
export const ContactUsRequestSchema = z.object({
    contact: ContactUsSchema,
});
export type ContactUsRequest = z.infer<typeof ContactUsRequestSchema>;
