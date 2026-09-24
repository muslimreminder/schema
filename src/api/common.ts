import { z } from 'zod';

/** Device / client that sent the request. */
export const ClientEnvironmentSchema = z.object({
    /** e.g. `Android 14`, `iOS 18.1`, or the user agent for the web. */
    os: z.string().trim().min(1).max(300),
    /** e.g. `Pixel 6`, `Web`. */
    device: z.string().trim().min(1).max(100),
    /** e.g. `1.0.3`, `landing`. */
    appVersion: z.string().trim().min(1).max(50),
});
export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>;

/** Anonymous identifiers of the reporter; `null` until the app has user sessions. */
export const ReporterSchema = z.object({
    userId: z.string().min(1).nullable().optional(),
    sessionId: z.string().min(1).nullable().optional(),
});
export type Reporter = z.infer<typeof ReporterSchema>;

export const ApiErrorResponseSchema = z.object({
    error: z.string(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/** Response of the ticket endpoints: the GitHub issue that was created. */
export const TicketCreatedResponseSchema = z.object({
    message: z.string(),
    url: z.url(),
});
export type TicketCreatedResponse = z.infer<typeof TicketCreatedResponseSchema>;
