import { z } from 'zod';
import { LanguageCodeSchema } from '../common/language.js';

/**
 * In-app inbox (More > Messages): our replies to the tickets of a device, and the announcements.
 *
 * - The app proves it is the device that wrote the tickets with `inboxKey`, a random secret it
 *   creates once and sends with every ticket and every inbox request. The first key the server
 *   sees for a `userId` is bound to it; a request with another key gets the announcements only.
 * - A device that sends a ticket with its `inboxKey`, or calls `POST /inbox`, has the Messages page:
 *   the pushes of the replies link to it. Nothing is kept for a device that never wrote to us.
 * - The app also tags its push subscription with `INBOX_PUSH_TAG`, so that the announcements can
 *   link to the page on the devices that have it (the native version does not change with an OTA).
 */

/** Languages the app is translated in: the admins write in French, replies go out in these. */
export const AppLanguageSchema = z.enum(['fr', 'en', 'ar']);
export type AppLanguage = z.infer<typeof AppLanguageSchema>;

export const AppPlatformSchema = z.enum(['android', 'ios']);
export type AppPlatform = z.infer<typeof AppPlatformSchema>;

/** Random secret of an install, e.g. `Crypto.randomUUID()`. Never logged, never written to an issue. */
export const InboxKeySchema = z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/);

/** Push tag the app sets on its Demepush user once it has the Messages page. */
export const INBOX_PUSH_TAG = { key: 'inbox', value: '1' } as const;

/** Deep link of a thread or an announcement: `muslimreminder://messages/<id>`. */
export const INBOX_LINK_PREFIX = 'muslimreminder://messages';
export const inboxLink = (id: string) => `${INBOX_LINK_PREFIX}/${encodeURIComponent(id)}`;

/** Body of `POST /inbox`. */
export const InboxRequestSchema = z.object({
    /** Device id, as `reporter.userId` in the tickets; `null` when the system gives none (announcements only). */
    userId: z.string().min(1).max(128).nullable(),
    inboxKey: InboxKeySchema,
    platform: AppPlatformSchema,
    /** Language of the app: announcements come in it (French when missing), the next replies too. */
    language: LanguageCodeSchema,
    /** Native version of the app, as reported to Demepush: announcements aimed at another version are left out. */
    appVersion: z.string().trim().min(1).max(64).nullable().default(null),
});
export type InboxRequest = z.infer<typeof InboxRequestSchema>;

export const InboxReplySchema = z.object({
    id: z.string().min(1),
    /** In the language the reply was sent in. */
    text: z.string().min(1),
    createdAt: z.iso.datetime({ offset: true }),
});
export type InboxReply = z.infer<typeof InboxReplySchema>;

/** One ticket of the device and our replies to it. Ids are opaque, unique across threads and announcements. */
export const InboxThreadSchema = z.object({
    id: z.string().min(1),
    ticket: z.object({
        type: z.enum(['bug', 'contact']),
        /** Bug title; `null` for a contact message. */
        title: z.string().nullable(),
        /** Bug description or contact message, as the user wrote it (may be empty for a bug). */
        text: z.string(),
        createdAt: z.iso.datetime({ offset: true }),
    }),
    /** Oldest first: a thread is listed once it has a reply. */
    replies: z.array(InboxReplySchema).min(1),
});
export type InboxThread = z.infer<typeof InboxThreadSchema>;

export const InboxAnnouncementSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    /** Language of `title` and `body`: the device's when the admins gave it, French otherwise. */
    language: LanguageCodeSchema,
    createdAt: z.iso.datetime({ offset: true }),
});
export type InboxAnnouncement = z.infer<typeof InboxAnnouncementSchema>;

/** Response of `POST /inbox`, newest first in both lists. */
export const InboxResponseSchema = z.object({
    threads: z.array(InboxThreadSchema),
    announcements: z.array(InboxAnnouncementSchema),
});
export type InboxResponse = z.infer<typeof InboxResponseSchema>;
