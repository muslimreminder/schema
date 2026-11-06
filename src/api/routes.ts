import { ApiErrorResponseSchema, TicketCreatedResponseSchema } from './common.js';
import { ContactUsRequestSchema } from './contact-us.js';
import { ReportBugRequestSchema } from './report-bug.js';
import { TelemetryPingSchema } from './telemetry.js';

/** Routes of the ticket worker (`github-issue-server`), shared by the worker and its clients. */
export const ticketRoutes = {
    reportBug: {
        method: 'POST',
        path: '/report-bug',
        request: ReportBugRequestSchema,
        response: TicketCreatedResponseSchema,
        error: ApiErrorResponseSchema,
    },
    contactUs: {
        method: 'POST',
        path: '/contact-us',
        request: ContactUsRequestSchema,
        response: TicketCreatedResponseSchema,
        error: ApiErrorResponseSchema,
    },
} as const;

/**
 * Route of the anonymous statistics, served by the same worker on `api.muslim-reminder.com`.
 * Answered `204` with no body; the app does not retry before its next time in the foreground.
 */
export const telemetryRoutes = {
    ping: {
        method: 'POST',
        path: '/telemetry',
        request: TelemetryPingSchema,
        error: ApiErrorResponseSchema,
    },
} as const;
