import { ApiErrorResponseSchema, TicketCreatedResponseSchema } from './common.js';
import { ContactUsRequestSchema } from './contact-us.js';
import { ReportBugRequestSchema } from './report-bug.js';

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
