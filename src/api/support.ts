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

/** Where one ticket stands: waiting for an admin, answered, or closed without a reply. */
export const TicketStatusSchema = z.enum(['awaiting', 'replied', 'handled']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

/**
 * How a ticket was closed. `done` and `wont_do` also close its GitHub issue (`completed`,
 * `not_planned`); `ignored` is for what needs nothing at all, and is refused on a ticket with an issue.
 */
export const TicketResolutionSchema = z.enum(['done', 'wont_do', 'ignored']);
export type TicketResolution = z.infer<typeof TicketResolutionSchema>;

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
    /** The GitHub issue of the ticket, `null` until it is converted or linked to one. Several tickets can share an issue. */
    issueNumber: z.number().int().nullable(),
    issueUrl: z.string().nullable(),
    /** The issue was closed from the admin or Telegram; `null` while it is open as far as we know. */
    issueClosed: z.object({ reason: IssueCloseReasonSchema, at: isoDate, by: z.string().min(1) }).nullable(),
    /** `replied` as soon as a reply answers this very ticket, else `handled` when `handled` is set. */
    status: TicketStatusSchema,
    /** Marked as needing no reply, or its issue was closed: by whom, when; `null` otherwise. */
    handled: z.object({ at: isoDate, by: z.string().min(1) }).nullable(),
    /** How the ticket was closed, by whom, when; `null` while it is open, answered or not. */
    resolution: z.object({ kind: TicketResolutionSchema, at: isoDate, by: z.string().min(1) }).nullable(),
    /** `bundleVersion` and `updateId`: `null` for the tickets of the app versions that do not send them. */
    environment: z.object({
        os: z.string(),
        device: z.string(),
        appVersion: z.string(),
        bundleVersion: z.string().nullable().default(null),
        updateId: z.string().nullable().default(null),
    }),
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

/**
 * Tickets of one device (`reporter.userId`), grouped.
 * @deprecated The admin lists the tickets one by one (`TicketSummarySchema`); `Conversation` stays.
 */
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

/** One row of the admin's list of tickets. */
export const TicketSummarySchema = SupportTicketSchema.pick({
    id: true,
    kind: true,
    language: true,
    status: true,
    resolution: true,
    issueNumber: true,
    environment: true,
    createdAt: true,
}).extend({
    /** Device that sent it (`reporter.userId`): the admin's page of a ticket lives under its device. */
    userId: z.string().min(1),
    /** First characters of the ticket, in French when translated. */
    preview: z.string(),
});
export type TicketSummary = z.infer<typeof TicketSummarySchema>;

export const ListTicketsInputSchema = z.object({
    /** `awaiting`: the tickets still open, answered or not. */
    filter: z.enum(['all', 'awaiting']).default('all'),
    limit: z.number().int().min(1).max(100).default(50),
    /** `nextCursor` of the previous page. */
    cursor: z.string().min(1).nullable().optional(),
});
export type ListTicketsInput = z.input<typeof ListTicketsInputSchema>;

export const TicketPageSchema = z.object({
    /** Most recently received first. */
    tickets: z.array(TicketSummarySchema),
    nextCursor: z.string().nullable(),
});
export type TicketPage = z.infer<typeof TicketPageSchema>;

/** @deprecated Use `ListTicketsInputSchema`. */
export const ListConversationsInputSchema = z.object({
    filter: z.enum(['all', 'awaiting']).default('all'),
    limit: z.number().int().min(1).max(100).default(50),
    /** `nextCursor` of the previous page. */
    cursor: z.string().min(1).nullable().optional(),
});
export type ListConversationsInput = z.input<typeof ListConversationsInputSchema>;

/** @deprecated Use `TicketPageSchema`. */
export const ConversationPageSchema = z.object({
    /** Most recent activity first. */
    conversations: z.array(ConversationSummarySchema),
    nextCursor: z.string().nullable(),
});
export type ConversationPage = z.infer<typeof ConversationPageSchema>;

export const MarkHandledInputSchema = z.object({
    /** Only this ticket is marked: the other tickets of the device stay as they are. */
    ticketId: z.string().min(1),
    author: z.string().min(1),
});
export type MarkHandledInput = z.input<typeof MarkHandledInputSchema>;

/** @deprecated Use `ResolveTicketInputSchema`. */
export const CloseIssueInputSchema = z.object({
    ticketId: z.string().min(1),
    reason: IssueCloseReasonSchema,
    author: z.string().min(1),
});
export type CloseIssueInput = z.input<typeof CloseIssueInputSchema>;

export const ResolveTicketInputSchema = z.object({
    ticketId: z.string().min(1),
    resolution: TicketResolutionSchema,
    author: z.string().min(1),
});
export type ResolveTicketInput = z.input<typeof ResolveTicketInputSchema>;

/** A note for the developers, in Markdown: e.g. the bug the support assistant spotted in the code. */
const issueNote = z.string().trim().min(1).max(20000);

export const CreateIssueInputSchema = z.object({
    ticketId: z.string().min(1),
    author: z.string().min(1),
    /** Replaces the title taken from the ticket. */
    title: z.string().trim().min(1).max(256).optional(),
    /** Added to the issue body, after the ticket. */
    note: issueNote.optional(),
});
export type CreateIssueInput = z.input<typeof CreateIssueInputSchema>;

export const LinkIssueInputSchema = z.object({
    ticketId: z.string().min(1),
    /** An issue that already exists in the tracker, for the same problem reported again. */
    issueNumber: z.number().int().positive(),
    author: z.string().min(1),
});
export type LinkIssueInput = z.input<typeof LinkIssueInputSchema>;

/** A note added to the GitHub issue a ticket already has. */
export const CommentIssueInputSchema = z.object({
    ticketId: z.string().min(1),
    body: issueNote,
    author: z.string().min(1),
});
export type CommentIssueInput = z.input<typeof CommentIssueInputSchema>;

/** The GitHub issue a ticket was converted to, or linked to. */
export const TicketIssueSchema = z.object({
    issueNumber: z.number().int(),
    issueUrl: z.string().min(1),
});
export type TicketIssue = z.infer<typeof TicketIssueSchema>;

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
 * Delivery receipt of the push of a reply or a broadcast, as Demepush counts it: the app confirms
 * that a push was displayed (`delivered`) and that it was opened (`clicked`). A device that is
 * off, or an app version that does not report, leaves a push `sent` without more.
 */
export const PushReceiptSchema = z.object({
    /** Devices the push was aimed at. */
    total: z.number().int().min(0),
    /** Not handed to Apple or Google yet: scheduled, queued, or held by a frequency cap. */
    pending: z.number().int().min(0),
    /** Handed to Apple or Google. `delivered` and `clicked` are among them. */
    sent: z.number().int().min(0),
    /** Displayed on the device, as the app confirmed. */
    delivered: z.number().int().min(0),
    /** Opened from the notification. */
    clicked: z.number().int().min(0),
    /** Refused by Apple or Google (token expired, app uninstalled…), or cancelled. */
    failed: z.number().int().min(0),
    /** Why the failed ones failed, most frequent first. */
    errors: z.array(z.object({ error: z.string().min(1), count: z.number().int().min(1) })),
    /** The first device to get there; `null` until one did (or when Demepush does not tell). */
    sentAt: isoDate.nullable(),
    deliveredAt: isoDate.nullable(),
    clickedAt: isoDate.nullable(),
    /** When these figures were read from Demepush. */
    checkedAt: isoDate,
});
export type PushReceipt = z.infer<typeof PushReceiptSchema>;

const receiptIds = z.array(z.string().min(1).max(32)).max(100).default([]);

export const GetPushReceiptsInputSchema = z.object({
    broadcastIds: receiptIds,
    replyIds: receiptIds,
});
export type GetPushReceiptsInput = z.input<typeof GetPushReceiptsInputSchema>;

/** Keyed by id; `null` for a push that never went out (no device, failed, cancelled) or that Demepush cannot read. */
export const PushReceiptsSchema = z.object({
    broadcasts: z.record(z.string(), PushReceiptSchema.nullable()),
    replies: z.record(z.string(), PushReceiptSchema.nullable()),
});
export type PushReceipts = z.infer<typeof PushReceiptsSchema>;

/**
 * Methods of the `SupportService` entrypoint of the ticket worker. The worker validates every
 * input with the schemas above; the admin binds it with
 * `services: [{ binding: "SUPPORT", service: "github-issue-server", entrypoint: "SupportService" }]`.
 */
export interface SupportServiceRpc {
    /** Tickets one by one, most recently received first. */
    listTickets(input: ListTicketsInput): Promise<TicketPage>;
    /** @deprecated Use `listTickets`. */
    listConversations(input: ListConversationsInput): Promise<ConversationPage>;
    getConversation(userId: string): Promise<Conversation | null>;
    translate(input: TranslateInput): Promise<Translations>;
    /** Saves the reply, sends its push, comments the GitHub issue if the ticket has one. */
    reply(input: ReplyInput): Promise<SupportReply>;
    /** Closes a ticket, its GitHub issue with the tickets sharing it, and archives their Telegram notifications. */
    resolveTicket(input: ResolveTicketInput): Promise<void>;
    /** Creates the GitHub issue of a ticket. Resolves to the existing one if it already has an issue. */
    createIssue(input: CreateIssueInput): Promise<TicketIssue>;
    /** Attaches a ticket to an issue that already exists. */
    linkIssue(input: LinkIssueInput): Promise<TicketIssue>;
    /** Comments the GitHub issue of a ticket; fails when the ticket has none. */
    commentIssue(input: CommentIssueInput): Promise<TicketIssue>;
    /** @deprecated Use `resolveTicket`. */
    closeIssue(input: CloseIssueInput): Promise<void>;
    /** @deprecated Use `resolveTicket`. */
    markHandled(input: MarkHandledInput): Promise<void>;
    /** Puts a closed ticket back in the queue. Its GitHub issue stays as it is. */
    reopenTicket(ticketId: string): Promise<void>;
    /** @deprecated Use `reopenTicket`. */
    reopenConversation(userId: string): Promise<void>;
    listBroadcasts(input: ListBroadcastsInput): Promise<Broadcast[]>;
    sendBroadcast(input: SendBroadcastInput): Promise<Broadcast>;
    /** Takes an announcement out of More > Messages (its push already went out). */
    unlistBroadcast(id: string): Promise<void>;
    /** Cancels a scheduled broadcast that has not gone out yet. */
    cancelBroadcast(id: string): Promise<void>;
    /** Delivery receipts of replies and broadcasts; a recent push is read again from Demepush, an old one comes from the cache. */
    getPushReceipts(input: GetPushReceiptsInput): Promise<PushReceipts>;
    /** Versions to aim a broadcast at, newest first; empty when Demepush does not tell. */
    listAppVersions(): Promise<AppVersionCount[]>;
}
