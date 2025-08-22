import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
	id: string;
	name: string;
	participants: string[];
	lastMessage?: string;
	lastMessageTime?: string;
	integrationId: string;
	platformName?: string;
	customerId: string;
	importNew?: boolean; // Whether to automatically import new messages from this integration
	createdAt: Date;
	updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
	{
		id: { type: String, required: true },
		name: { type: String, required: true },
		participants: [{ type: String }],
		lastMessage: { type: String },
		lastMessageTime: { type: String },
		integrationId: { type: String, required: true },
		platformName: { type: String },
		customerId: { type: String, required: true },
		importNew: { type: Boolean, default: false }, // Default to false
	},
	{
		timestamps: true,
	}
);

// Create compound index for efficient queries
ChatSchema.index({ customerId: 1, integrationId: 1 });
ChatSchema.index({ customerId: 1, id: 1 });

export const Chat =
	mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
