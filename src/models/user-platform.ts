import mongoose, { Schema, Document } from "mongoose";

export interface IUserPlatform extends Document {
	customerId: string;
	platformId: string; // Integration.app platform ID (e.g., "slack", "discord")
	platformName: string; // Display name of the platform
	externalUserId: string; // User ID from the external platform
	externalUserName?: string; // Username/display name from the external platform
	externalUserEmail?: string; // Email from the external platform
	connectionId: string; // Integration.app connection ID
	lastSynced: Date;
	createdAt: Date;
	updatedAt: Date;
}

const UserPlatformSchema = new Schema<IUserPlatform>(
	{
		customerId: { type: String, required: true },
		platformId: { type: String, required: true },
		platformName: { type: String, required: true },
		externalUserId: { type: String, required: true },
		externalUserName: { type: String },
		externalUserEmail: { type: String },
		connectionId: { type: String, required: true },
		lastSynced: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	}
);

// Create compound indexes for efficient queries
UserPlatformSchema.index({ customerId: 1, platformId: 1 });
UserPlatformSchema.index({ customerId: 1, connectionId: 1 });
UserPlatformSchema.index({ externalUserId: 1, platformId: 1 });

// Ensure unique user per platform per customer
UserPlatformSchema.index(
	{ customerId: 1, platformId: 1, externalUserId: 1 },
	{ unique: true }
);

export const UserPlatform =
	mongoose.models.UserPlatform ||
	mongoose.model<IUserPlatform>("UserPlatform", UserPlatformSchema);
