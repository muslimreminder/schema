import { z } from 'zod';
import { LanguageCodeSchema } from '../common/language.js';
import { InboxKeySchema } from './inbox.js';

/** Device / client that sent the request. */
export const ClientEnvironmentSchema = z.object({
    /** e.g. `Android 14`, `iOS 18.1`, or the user agent for the web. */
    os: z.string().trim().min(1).max(300),
    /** e.g. `Pixel 6`, `Web`. */
    device: z.string().trim().min(1).max(100),
    /** e.g. `1.0.3`, `landing`. */
    appVersion: z.string().trim().min(1).max(50),
    /** Language of the app, e.g. `fr`: replies to the ticket are translated into it. */
    language: LanguageCodeSchema.optional(),
});
export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>;

/** Anonymous identifiers of the reporter, also set on the Sentry events of the app to find them back. */
export const ReporterSchema = z.object({
    /** Identifier of the device: `ANDROID_ID` on Android, `identifierForVendor` on iOS. */
    userId: z.string().min(1).nullable().optional(),
    /** Identifier of the app launch the ticket was sent from. */
    sessionId: z.string().min(1).nullable().optional(),
    /**
     * Secret of the install that also opens its inbox (see `InboxRequestSchema`). Sent by the app
     * versions that have the Messages page; never written to the issue, the logs nor Sentry.
     */
    inboxKey: InboxKeySchema.optional(),
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
