import { describe, expect, it } from 'vitest';
import { ContactUsRequestSchema, ReportBugRequestSchema, ticketRoutes, TicketCreatedResponseSchema } from '../src/api/index.js';

const environment = { os: 'Android 14', device: 'Pixel 6', appVersion: '1.0.3' };
const reporter = { userId: null, sessionId: null };
const createdAt = '2026-09-24T12:30:00.000Z';

describe('report bug', () => {
    it('accepts a valid request and trims text', () => {
        const parsed = ReportBugRequestSchema.parse({
            bug: { title: '  Crash on launch ', description: 'Steps…', environment, reporter, createdAt },
        });
        expect(parsed.bug.title).toBe('Crash on launch');
    });

    it('accepts a missing reporter id and description', () => {
        expect(ReportBugRequestSchema.safeParse({ bug: { title: 'x', environment, reporter: {}, createdAt } }).success).toBe(true);
    });

    it('rejects an empty title', () => {
        expect(ReportBugRequestSchema.safeParse({ bug: { title: '   ', environment, reporter, createdAt } }).success).toBe(false);
    });

    it('rejects a non ISO createdAt (Date#toTimeString)', () => {
        const bug = { title: 'x', environment, reporter, createdAt: '14:32:05 GMT+0200 (CEST)' };
        expect(ReportBugRequestSchema.safeParse({ bug }).success).toBe(false);
    });

    it('accepts an ISO date with offset', () => {
        const bug = { title: 'x', environment, reporter, createdAt: '2026-09-24T14:30:00+02:00' };
        expect(ReportBugRequestSchema.safeParse({ bug }).success).toBe(true);
    });
});

describe('contact us', () => {
    it('accepts a message with or without email', () => {
        expect(ContactUsRequestSchema.safeParse({ contact: { message: 'Salam', environment, reporter, createdAt } }).success).toBe(true);
        const parsed = ContactUsRequestSchema.parse({
            contact: { message: 'Salam', email: ' user@example.com ', environment, reporter, createdAt },
        });
        expect(parsed.contact.email).toBe('user@example.com');
    });

    it('rejects placeholder emails and empty messages', () => {
        const withPlaceholder = { message: 'Salam', email: 'No email provided', environment, reporter, createdAt };
        expect(ContactUsRequestSchema.safeParse({ contact: withPlaceholder }).success).toBe(false);
        expect(ContactUsRequestSchema.safeParse({ contact: { message: '', environment, reporter, createdAt } }).success).toBe(false);
    });
});

describe('routes', () => {
    it('exposes the worker contract', () => {
        expect(ticketRoutes.reportBug.path).toBe('/report-bug');
        expect(ticketRoutes.contactUs.path).toBe('/contact-us');
        expect(TicketCreatedResponseSchema.safeParse({ message: 'Issue created', url: 'https://github.com/muslimreminder/project-management/issues/1' }).success).toBe(true);
    });
});
