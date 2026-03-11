import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Optional, in case of anonymous actions or system events
    },
    action: {
        type: String,
        required: true,
        enum: [
            "LOGIN",
            "LOGOUT",
            "REGISTER",
            "ACCOUNT_DELETED",
            "EVENT_CREATED",
            "EVENT_UPDATED",
            "EVENT_DELETED",
            "BOOKING_CREATED",
            "BOOKING_CANCELLED",
            "PROFILE_UPDATED",
            "OTHER"
        ]
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: null
    }
}, { timestamps: true });

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
export default ActivityLog;
