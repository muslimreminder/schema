import { z } from 'zod';
import { LanguageCodeSchema } from '../common/language.js';
import { AppLanguageSchema, AppPlatformSchema } from './inbox.js';
import { AppSettingsSchema } from './telemetry.js';

/**
 * Support module of the admin: calls of the admin Worker to the ticket worker over the
 * `SupportService` RPC entrypoint (service binding), never over the public internet.
 *
 * The admins write in French. Replies and broadcasts are translated before they are sent, and
 * the admins check and may edit each translation: `translate` previews, `reply` and
 * `sendBroadcast` take the final texts.
 */

const isoDate = z.iso.datetime({ offset: true });

/** A native version of the app, as the devices report it to Demepush (an OTA does not change it). */
const appVersion = z.string().trim().min(1).max(64);

/**
 * What happened to the push of a reply or a broadcast.
 * - `linked`: sent with a link to More > Messages.
 * - `text_only`: the device has no Messages page yet, the push carries the text and opens the app.
 * - `no_device`: no push subscription matches the user (the reply waits in the inbox).
 * - `failed`: Demepush refused or did not answer (the reply is kept anyway).
 */
export const PushOutcomeSchema = z.enum(['linked', 'text_only', 'no_device', 'failed']);
export type PushOutcome = z.infer<typeof PushOutcomeSchema>;

/** How a GitHub issue was closed: the ✅ and ❌ of Telegram. */
export const IssueCloseReasonSchema = z.enum(['completed', 'not_planned']);
export type IssueCloseReason = z.infer<typeof IssueCloseReasonSchema>;

export const TicketKindSchema = z.enum(['bug', 'contact']);
export type TicketKind = z.infer<typeof TicketKindSchema>;

export const SupportTicketSchema = z.object({
    type: z.literal('ticket'),
    id: z.string().min(1),
    kind: TicketKindSchema,
    /** Bug title; `null` for a contact message. */
    title: z.string().nullable(),
    /** Bug description or contact message, as written. */
    text: z.string(),
    /** French version, when the ticket was translated. */
    translation: z.object({ title: z.string().nullable(), text: z.string().nullable() }).nullable(),
    /** Language the ticket was written in, when known (sent by the app or detected). */
    language: LanguageCodeSchema.nullable(),
    email: z.string().nullable(),
    issueNumber: z.number().int().nullable(),
    issueUrl: z.string().nullable(),
    /** The issue was closed from the admin or Telegram; `null` while it is open as far as we know. */
    issueClosed: z.object({ reason: IssueCloseReasonSchema, at: isoDate, by: z.string().min(1) }).nullable(),
    environment: z.object({ os: z.string(), device: z.string(), appVersion: z.string() }),
    /** Preferences of the app when the ticket was sent; `null` for the app versions that do not send them. */
    settings: AppSettingsSchema.nullable(),
    createdAt: isoDate,
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const SupportReplySchema = z.object({
    type: z.literal('reply'),
    id: z.string().min(1),
    ticketId: z.string().min(1),
    /** As the admin wrote it. */
    textFr: z.string().min(1),
    /** As sent to the user, in `language`. */
    text: z.string().min(1),
    language: AppLanguageSchema,
    /** Email of the admin, from Cloudflare Access. */
    author: z.string().min(1),
    push: PushOutcomeSchema,
    createdAt: isoDate,
});
export type SupportReply = z.infer<typeof SupportReplySchema>;

export const SupportItemSchema = z.discriminatedUnion('type', [SupportTicketSchema, SupportReplySchema]);
export type SupportItem = z.infer<typeof SupportItemSchema>;

/** Tickets of one device (`reporter.userId`), grouped. */
export const ConversationSummarySchema = z.object({
    userId: z.string().min(1),
    platform: AppPlatformSchema.nullable(),
    /** Best known language: the last one the app sent, else guessed from the tickets. */
    language: AppLanguageSchema.nullable(),
    /** The device has More > Messages (ticket with an inbox key, or `POST /inbox`): replies link to it. */
    inboxReady: z.boolean(),
    /** Last email the user left. */
    email: z.string().nullable(),
    ticketCount: z.number().int().min(1),
    /** Whether the latest ticket is a bug report or a contact message. */
    latestTicketKind: TicketKindSchema,
    /** A ticket came after the last reply, and no admin marked it as handled. */
    awaitingReply: z.boolean(),
    /** Every ticket after the last reply was marked as needing no reply: by whom, when; `null` otherwise. */
    handled: z.object({ at: isoDate, by: z.string().min(1) }).nullable(),
    lastItemAt: isoDate,
    /** First characters of the last item, in French when translated. */
    preview: z.string(),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

export const ConversationSchema = ConversationSummarySchema.extend({
    /** Tickets and replies, oldest first. */
    items: z.array(SupportItemSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ListConversationsInputSchema = z.object({
    filter: z.enum(['all', 'awaiting']).default('all'),
    limit: z.number().int().min(1).max(100).default(50),
    /** `nextCursor` of the previous page. */
    cursor: z.string().min(1).nullable().optional(),
});
export type ListConversationsInput = z.input<typeof ListConversationsInputSchema>;

export const ConversationPageSchema = z.object({
    /** Most recent activity first. */
    conversations: z.array(ConversationSummarySchema),
    nextCursor: z.string().nullable(),
});
export type ConversationPage = z.infer<typeof ConversationPageSchema>;

export const MarkHandledInputSchema = z.object({
    /** Latest ticket the admin has read: it and the older ones are marked, a ticket that came since stays open. */
    ticketId: z.string().min(1),
    author: z.string().min(1),
});
export type MarkHandledInput = z.input<typeof MarkHandledInputSchema>;

export const CloseIssueInputSchema = z.object({
    ticketId: z.string().min(1),
    reason: IssueCloseReasonSchema,
    author: z.string().min(1),
});
export type CloseIssueInput = z.input<typeof CloseIssueInputSchema>;

/** French text to translate into some of the app languages. */
export const TranslateInputSchema = z.object({
    text: z.string().trim().min(1).max(5000),
    to: z.array(AppLanguageSchema).min(1),
});
export type TranslateInput = z.input<typeof TranslateInputSchema>;

/** Translations by language; a language is missing when the model failed on it. */
export const TranslationsSchema = z.partialRecord(AppLanguageSchema, z.string());
export type Translations = z.infer<typeof TranslationsSchema>;

export const ReplyInputSchema = z.object({
    ticketId: z.string().min(1),
    textFr: z.string().trim().min(1).max(5000),
    language: AppLanguageSchema,
    /** Final text in `language`, as checked by the admin; the same as `textFr` for French. */
    text: z.string().trim().min(1).max(5000),
    author: z.string().min(1),
});
export type ReplyInput = z.input<typeof ReplyInputSchema>;

const localized = (max: number) =>
    z.object({
        fr: z.string().trim().min(1).max(max),
        en: z.string().trim().min(1).max(max).optional(),
        ar: z.string().trim().min(1).max(max).optional(),
    });

/** A push sent to many devices; an announcement when it is also listed in More > Messages. */
export const BroadcastSchema = z.object({
    id: z.string().min(1),
    /** Devices without their language get the French text. */
    title: localized(100),
    body: localized(1000),
    /** Sent as an announcement (also listed in More > Messages), or as a plain push. */
    listed: z.boolean(),
    /** When an announcement was taken out of More > Messages; `null` while it is listed (and for a plain push). */
    unlistedAt: isoDate.nullable(),
    /** Only the devices in this language; everyone when `null`. */
    language: AppLanguageSchema.nullable(),
    /** Only the devices on one of these native versions; every version when empty. */
    appVersions: z.array(appVersion),
    /** Handed to Demepush to go out at this time; `null` when sent at once. An announcement is listed from then on. */
    scheduledAt: isoDate.nullable(),
    /** A scheduled send cancelled before it went out. */
    canceledAt: isoDate.nullable(),
    author: z.string().min(1),
    push: PushOutcomeSchema,
    /** Devices Demepush sent it to, when it told. */
    recipients: z.number().int().min(0).nullable(),
    createdAt: isoDate,
});
export type Broadcast = z.infer<typeof BroadcastSchema>;

export const SendBroadcastInputSchema = BroadcastSchema.pick({ title: true, body: true, listed: true, author: true }).extend({
    language: AppLanguageSchema.nullable().default(null),
    appVersions: z.array(appVersion).max(50).default([]),
    /** In the future, 30 days ahead at most (the limit of Demepush); `null` sends at once. */
    scheduledAt: isoDate.nullable().default(null),
});
export type SendBroadcastInput = z.input<typeof SendBroadcastInputSchema>;

export const ListBroadcastsInputSchema = z.object({
    limit: z.number().int().min(1).max(100).default(50),
});
export type ListBroadcastsInput = z.input<typeof ListBroadcastsInputSchema>;

/** A native version of the app and the subscribed devices that run it. */
export const AppVersionCountSchema = z.object({
    version: appVersion,
    devices: z.number().int().min(0),
});
export type AppVersionCount = z.infer<typeof AppVersionCountSchema>;

/**
 * Methods of the `SupportService` entrypoint of the ticket worker. The worker validates every
 * input with the schemas above; the admin binds it with
 * `services: [{ binding: "SUPPORT", service: "github-issue-server", entrypoint: "SupportService" }]`.
 */
export interface SupportServiceRpc {
    listConversations(input: ListConversationsInput): Promise<ConversationPage>;
    getConversation(userId: string): Promise<Conversation | null>;
    translate(input: TranslateInput): Promise<Translations>;
    /** Saves the reply, sends its push, comments the GitHub issue. */
    reply(input: ReplyInput): Promise<SupportReply>;
    /** Closes the GitHub issue of a ticket and archives its Telegram notification, as the ✅ / ❌ buttons do. */
    closeIssue(input: CloseIssueInput): Promise<void>;
    /** Marks tickets as needing no reply: the conversation stops awaiting one, until the device writes again. */
    markHandled(input: MarkHandledInput): Promise<void>;
    /** Puts the tickets of a device marked as handled back in the queue. */
    reopenConversation(userId: string): Promise<void>;
    listBroadcasts(input: ListBroadcastsInput): Promise<Broadcast[]>;
    sendBroadcast(input: SendBroadcastInput): Promise<Broadcast>;
    /** Takes an announcement out of More > Messages (its push already went out). */
    unlistBroadcast(id: string): Promise<void>;
    /** Cancels a scheduled broadcast that has not gone out yet. */
    cancelBroadcast(id: string): Promise<void>;
    /** Versions to aim a broadcast at, newest first; empty when Demepush does not tell. */
    listAppVersions(): Promise<AppVersionCount[]>;
}
