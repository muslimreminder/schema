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
    /**
     * Version of the JavaScript the app runs, e.g. `1.2.6`: higher than `appVersion` once an over-the-air
     * update is applied on the binary. Absent from the versions that do not send it.
     */
    bundleVersion: z.string().trim().min(1).max(50).optional(),
    /** Id of the over-the-air update running, `null` on the bundle shipped in the binary. */
    updateId: z.string().trim().min(1).max(100).nullable().optional(),
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

/** Response of the ticket endpoints: the ticket is stored, the admins are told. */
export const TicketCreatedResponseSchema = z.object({
    message: z.string(),
    /** Opaque id of the stored ticket. */
    id: z.string().optional(),
    /** @deprecated A ticket no longer creates a GitHub issue: absent from the answers of the current worker. */
    url: z.url().optional(),
});
export type TicketCreatedResponse = z.infer<typeof TicketCreatedResponseSchema>;
