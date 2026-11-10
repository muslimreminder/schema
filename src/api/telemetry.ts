import { z } from 'zod';

/**
 * Anonymous usage statistics: one ping a day at most per install, without any identifier.
 *
 * - Audiences come from flags the app works out itself: a device sends `firstOfWeek` once per
 *   calendar week, so the pings of a week that carry it count the active devices of that week.
 * - `settings` is a picture of the preferences, flat (`reminder.frequency`…) so that new keys
 *   need no change here nor on the server. Values are coarse on purpose (hours, rounded volumes,
 *   count buckets): never a position, a note, a text typed by the user or an identifier.
 * - `usage` holds the counters (`screen.quran`, `event.tasbih.tap`…) since the last ping sent,
 *   which covers `usageDays` days of use.
 *
 * The country is not sent: the worker reads it from the request, and does not keep the IP.
 */

export const TELEMETRY_VERSION = 1;

/** Most keys a ping may hold in `settings` or in `usage`. */
export const TELEMETRY_MAX_KEYS = 200;

/** Dotted key of a setting or a counter, e.g. `reminder.frequency`, `screen.quran`, `event.tasbih.tap`. */
export const TelemetryKeySchema = z.string().regex(/^[a-z][a-zA-Z0-9_.-]{0,63}$/);

/** Value of a setting: kept short so that the values stay a handful per key. */
export const TelemetryValueSchema = z.union([z.string().max(64), z.number().finite(), z.boolean(), z.null()]);
export type TelemetryValue = z.infer<typeof TelemetryValueSchema>;

const maxKeys = (record: Record<string, unknown>) => Object.keys(record).length <= TELEMETRY_MAX_KEYS;

/**
 * Preferences of the app joined to a ticket, so that the admins can help: the same coarse picture
 * as `settings` in a ping. Copied to the GitHub issue when a ticket gets one, to help debugging;
 * never sent to Telegram nor written to the logs.
 */
export const AppSettingsSchema = z.record(TelemetryKeySchema, TelemetryValueSchema).refine(maxKeys, {
    message: `At most ${TELEMETRY_MAX_KEYS} keys`,
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

/** ISO 8601 week, e.g. `2026-W45`. */
export const IsoWeekSchema = z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/);

export const TelemetryAppSchema = z.object({
    /** Version of the JS bundle running, OTA updates included, e.g. `1.2.3`. */
    version: z.string().trim().min(1).max(32),
    /** `runtimeVersion` of the binary, e.g. `1.2.2`. */
    runtime: z.string().trim().min(1).max(32).nullable(),
    /** Id of the OTA update running, `null` for the bundle embedded in the binary. */
    update: z.string().trim().min(1).max(64).nullable(),
    platform: z.enum(['android', 'ios']),
    /** Major version of the OS, e.g. `14` (Android API levels are not sent). */
    os: z.string().trim().min(1).max(16),
    /** Language of the app, e.g. `fr`. */
    lang: z.string().trim().min(1).max(8),
});
export type TelemetryApp = z.infer<typeof TelemetryAppSchema>;

export const TelemetryAudienceSchema = z.object({
    /** First ping ever sent by this install. */
    firstPing: z.boolean(),
    /** First ping of the calendar week (ISO, local time) for this install. */
    firstOfWeek: z.boolean(),
    /** First ping of the calendar month (local time) for this install. */
    firstOfMonth: z.boolean(),
    /** Week the app was installed, `null` when the system does not tell. */
    installWeek: IsoWeekSchema.nullable(),
    /** Days the app was opened among the last 28, today included. */
    activeDays28: z.number().int().min(0).max(28),
});
export type TelemetryAudience = z.infer<typeof TelemetryAudienceSchema>;

export const TelemetryPingSchema = z.object({
    v: z.literal(TELEMETRY_VERSION),
    app: TelemetryAppSchema,
    audience: TelemetryAudienceSchema,
    settings: z.record(TelemetryKeySchema, TelemetryValueSchema).refine(maxKeys, {
        message: `At most ${TELEMETRY_MAX_KEYS} settings`,
    }),
    usage: z.record(TelemetryKeySchema, z.number().int().min(0).max(1_000_000)).refine(maxKeys, {
        message: `At most ${TELEMETRY_MAX_KEYS} counters`,
    }),
    /** Days of use the counters of `usage` cover: `0` for the first ping, more after days without network. */
    usageDays: z.number().int().min(0).max(366),
});
export type TelemetryPing = z.infer<typeof TelemetryPingSchema>;
