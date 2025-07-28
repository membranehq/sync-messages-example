import mongoose, { Schema, Document } from "mongoose";

export interface ISyncStatus extends Document {
	customerId: string;
	isSyncing: boolean;
	startTime: Date;
	lastSyncTime?: Date;
	syncId: string; // Unique identifier for this sync operation
	status: "pending" | "running" | "completed" | "failed";
	error?: string;
	totalMessages?: number;
	totalChats?: number;
	createdAt: Date;
	updatedAt: Date;
}

const SyncStatusSchema = new Schema<ISyncStatus>(
	{
		customerId: { type: String, required: true },
		isSyncing: { type: Boolean, required: true, default: false },
		startTime: { type: Date, required: true },
		lastSyncTime: { type: Date },
		syncId: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: ["pending", "running", "completed", "failed"],
			default: "pending",
		},
		error: { type: String },
		totalMessages: { type: Number },
		totalChats: { type: Number },
	},
	{
		timestamps: true,
	}
);

// Create compound index for efficient queries
SyncStatusSchema.index({ customerId: 1, syncId: 1 });
SyncStatusSchema.index({ customerId: 1, isSyncing: 1 });

// Ensure only one active sync per customer
SyncStatusSchema.index(
	{ customerId: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: { $in: ["pending", "running"] } },
	}
);

export const SyncStatus =
	mongoose.models.SyncStatus ||
	mongoose.model<ISyncStatus>("SyncStatus", SyncStatusSchema);
