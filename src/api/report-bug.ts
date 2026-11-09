import { z } from 'zod';
import { ClientEnvironmentSchema, ReporterSchema } from './common.js';
import { AppSettingsSchema } from './telemetry.js';

export const ReportBugSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5000).optional(),
    /** To contact the reporter back. Omit when the user gave none (never send a placeholder). */
    email: z.string().trim().pipe(z.email()).optional(),
    environment: ClientEnvironmentSchema,
    reporter: ReporterSchema,
    /** Preferences of the app when the ticket was sent, so that the admins can help. */
    settings: AppSettingsSchema.optional(),
    /** ISO 8601, e.g. `new Date().toISOString()`. */
    createdAt: z.iso.datetime({ offset: true }),
});
export type ReportBug = z.infer<typeof ReportBugSchema>;

/** Body of `POST /report-bug`. */
export const ReportBugRequestSchema = z.object({
    bug: ReportBugSchema,
});
export type ReportBugRequest = z.infer<typeof ReportBugRequestSchema>;
