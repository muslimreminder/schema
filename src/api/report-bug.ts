import { z } from 'zod';
import { ClientEnvironmentSchema, ReporterSchema } from './common.js';

export const ReportBugSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5000).optional(),
    environment: ClientEnvironmentSchema,
    reporter: ReporterSchema,
    /** ISO 8601, e.g. `new Date().toISOString()`. */
    createdAt: z.iso.datetime({ offset: true }),
});
export type ReportBug = z.infer<typeof ReportBugSchema>;

/** Body of `POST /report-bug`. */
export const ReportBugRequestSchema = z.object({
    bug: ReportBugSchema,
});
export type ReportBugRequest = z.infer<typeof ReportBugRequestSchema>;
