import ActivityLog from "../models/ActivityLog.js";

/**
 * Helper to log user or system activity silently in the background.
 * Fire and forget - does not throw errors that would interrupt the main user flow.
 *
 * @param {Object} params
 * @param {String} params.action - Enum value from ActivityLog model
 * @param {String} params.description - Human-readable description
 * @param {String|mongoose.Types.ObjectId} [params.user] - Optional user ID
 * @param {Object} [params.metadata] - Optional arbitrary data payload
 * @param {String} [params.ipAddress] - Optional IP Address
 */
export const logActivity = async ({ action, description, user, metadata = {}, ipAddress = null }) => {
    console.log(`[ACTIVITY LOG ATTEMPT] Action: ${action}, Description: ${description}`);
    try {
        const logEntry = new ActivityLog({
            action,
            description,
            user: user || undefined,
            metadata,
            ipAddress
        });

        await logEntry.save();
        console.log(`[ACTIVITY LOG SUCCESS] [${action}] ${description}`);
    } catch (err) {
        // We intentionally catch and swallow this error so background logging
        // failures never break the primary API response for the user
        console.error(`[ACTIVITY LOG ERROR] Failed to record ${action}:`, err.message);
    }
};
