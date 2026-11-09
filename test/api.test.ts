import { describe, expect, it } from 'vitest';
import {
    ContactUsRequestSchema,
    ConversationSchema,
    TicketPageSchema,
    inboxLink,
    InboxRequestSchema,
    InboxResponseSchema,
    inboxRoutes,
    ReplyInputSchema,
    SendBroadcastInputSchema,
    TranslationsSchema,
    ReportBugRequestSchema,
    TELEMETRY_MAX_KEYS,
    TelemetryPingSchema,
    telemetryRoutes,
    ticketRoutes,
    TicketCreatedResponseSchema,
} from '../src/api/index.js';

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

    it('accepts an optional email to contact the reporter back', () => {
        const parsed = ReportBugRequestSchema.parse({
            bug: { title: 'x', email: ' user@example.com ', environment, reporter, createdAt },
        });
        expect(parsed.bug.email).toBe('user@example.com');
        expect(ReportBugRequestSchema.safeParse({ bug: { title: 'x', email: 'nope', environment, reporter, createdAt } }).success).toBe(false);
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
        expect(telemetryRoutes.ping.path).toBe('/telemetry');
    });
});

describe('telemetry ping', () => {
    const ping = {
        v: 1,
        app: { version: '1.2.3', runtime: '1.2.2', update: null, platform: 'android', os: '14', lang: 'fr' },
        audience: { firstPing: false, firstOfWeek: true, firstOfMonth: false, installWeek: '2026-W45', activeDays28: 12 },
        settings: { 'reminder.enabled': true, 'reminder.frequency': 25, 'salat.method': 'MUSLIM_WORLD_LEAGUE', 'quran.translation': null },
        usage: { 'screen.quran': 3, 'event.tasbih.tap': 99 },
        usageDays: 1,
    };

    it('accepts a valid ping', () => {
        expect(TelemetryPingSchema.safeParse(ping).success).toBe(true);
    });

    it('rejects an unknown version, so that a new format is never misread', () => {
        expect(TelemetryPingSchema.safeParse({ ...ping, v: 2 }).success).toBe(false);
    });

    it('rejects malformed keys and nested values', () => {
        expect(TelemetryPingSchema.safeParse({ ...ping, settings: { 'Reminder Enabled': true } }).success).toBe(false);
        expect(TelemetryPingSchema.safeParse({ ...ping, settings: { 'quran.notes': { '2:255': 'text' } } }).success).toBe(false);
        expect(TelemetryPingSchema.safeParse({ ...ping, settings: { 'app.text': 'x'.repeat(65) } }).success).toBe(false);
    });

    it('rejects negative or fractional counters', () => {
        expect(TelemetryPingSchema.safeParse({ ...ping, usage: { 'screen.quran': -1 } }).success).toBe(false);
        expect(TelemetryPingSchema.safeParse({ ...ping, usage: { 'screen.quran': 1.5 } }).success).toBe(false);
    });

    it('caps the number of keys', () => {
        const settings = Object.fromEntries(Array.from({ length: TELEMETRY_MAX_KEYS + 1 }, (_, i) => [`k.${i}`, i]));
        expect(TelemetryPingSchema.safeParse({ ...ping, settings }).success).toBe(false);
    });

    it('checks the install week format', () => {
        expect(TelemetryPingSchema.safeParse({ ...ping, audience: { ...ping.audience, installWeek: '2026-45' } }).success).toBe(false);
        expect(TelemetryPingSchema.safeParse({ ...ping, audience: { ...ping.audience, installWeek: null } }).success).toBe(true);
    });
});

describe('support inbox', () => {
    const inboxKey = '3f2b8c1e-8d4a-4c55-9a51-0d7c2b1e6f90';
    const request = { userId: 'a1b2c3d4e5f60718', inboxKey, platform: 'android', language: 'ar' };

    it('lets a ticket carry the app language and the inbox key', () => {
        const parsed = ContactUsRequestSchema.parse({
            contact: { message: 'Salam', environment: { ...environment, language: 'ar' }, reporter: { ...reporter, inboxKey }, createdAt },
        });
        expect(parsed.contact.environment.language).toBe('ar');
        expect(parsed.contact.reporter.inboxKey).toBe(inboxKey);
    });

    it('rejects a short or malformed inbox key', () => {
        const contact = (key: string) => ({ contact: { message: 'x', environment, reporter: { inboxKey: key }, createdAt } });
        expect(ContactUsRequestSchema.safeParse(contact('short')).success).toBe(false);
        expect(ContactUsRequestSchema.safeParse(contact('not a key with spaces!!')).success).toBe(false);
    });

    it('accepts an inbox request, with or without a device id', () => {
        expect(InboxRequestSchema.safeParse(request).success).toBe(true);
        expect(InboxRequestSchema.safeParse({ ...request, userId: null }).success).toBe(true);
        expect(InboxRequestSchema.safeParse({ ...request, platform: 'web' }).success).toBe(false);
    });

    it('lists a thread only once it has a reply', () => {
        const thread = {
            id: 't12',
            ticket: { type: 'contact', title: null, text: 'Salam', createdAt },
            replies: [{ id: 'r3', text: 'وعليكم السلام', createdAt }],
        };
        expect(InboxResponseSchema.safeParse({ threads: [thread], announcements: [] }).success).toBe(true);
        expect(InboxResponseSchema.safeParse({ threads: [{ ...thread, replies: [] }], announcements: [] }).success).toBe(false);
    });

    it('builds the deep link of an inbox item', () => {
        expect(inboxLink('t12')).toBe('muslimreminder://messages/t12');
        expect(inboxRoutes.list).toMatchObject({ method: 'POST', path: '/inbox' });
    });
});

describe('support admin', () => {
    it('needs the final text of a reply in its language', () => {
        expect(ReplyInputSchema.safeParse({ ticketId: 't12', textFr: 'Bonjour', language: 'en', text: 'Hello', author: 'a@b.c' }).success).toBe(true);
        expect(ReplyInputSchema.safeParse({ ticketId: 't12', textFr: 'Bonjour', language: 'de', text: 'Hallo', author: 'a@b.c' }).success).toBe(false);
    });

    it('needs the French text of a broadcast and sends it to everyone by default', () => {
        const parsed = SendBroadcastInputSchema.parse({ title: { fr: 'Ramadan' }, body: { fr: 'Ramadan moubarak', ar: 'رمضان مبارك' }, listed: true, author: 'a@b.c' });
        expect(parsed.language).toBeNull();
        expect(SendBroadcastInputSchema.safeParse({ title: { en: 'Ramadan' }, body: { en: 'x' }, listed: true, author: 'a@b.c' }).success).toBe(false);
    });

    it('allows a missing translation', () => {
        expect(TranslationsSchema.safeParse({ en: 'Hello' }).success).toBe(true);
        expect(TranslationsSchema.safeParse({ de: 'Hallo' }).success).toBe(false);
    });

    it('groups tickets and replies in a conversation', () => {
        const conversation = {
            userId: 'a1b2c3d4e5f60718', platform: 'ios', language: 'fr', inboxReady: false, email: null,
            ticketCount: 1, latestTicketKind: 'contact', awaitingReply: true, handled: null, lastItemAt: createdAt, preview: 'Salam',
            items: [{
                type: 'ticket', id: 't12', kind: 'bug', title: 'Crash', text: '', translation: null, language: 'fr', email: null,
                issueNumber: 42, issueUrl: 'https://github.com/muslimreminder/project-management/issues/42', issueClosed: null, status: 'awaiting', handled: null, environment, settings: null, createdAt,
            }],
        };
        expect(ConversationSchema.safeParse(conversation).success).toBe(true);
    });

    it('lists the tickets one by one, with where each one stands', () => {
        const row = { id: 't12', userId: 'a1b2c3d4e5f60718', kind: 'bug', language: 'ar', status: 'awaiting', environment, createdAt, preview: 'Salam' };
        expect(TicketPageSchema.safeParse({ tickets: [row], nextCursor: null }).success).toBe(true);
        expect(TicketPageSchema.safeParse({ tickets: [{ ...row, status: 'closed' }], nextCursor: null }).success).toBe(false);
    });
});
