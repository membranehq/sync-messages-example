import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
	id: string;
	content: string;
	sender: string;
	ownerName?: string;
	timestamp: string;
	chatId?: string;
	integrationId: string;
	platformName?: string;
	customerId: string;
	messageType: "user" | "third-party";
	status: "pending" | "sent" | "failed";
	flowRunId?: string;
	externalMessageId?: string;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
	{
		id: { type: String, required: true },
		content: { type: String, required: true },
		sender: { type: String, required: true },
		ownerName: { type: String },
		timestamp: { type: String, required: true },
		chatId: { type: String },
		integrationId: { type: String, required: true },
		platformName: { type: String },
		customerId: { type: String, required: true },
		messageType: {
			type: String,
			required: true,
			enum: ["user", "third-party"],
			default: "user",
		},
		status: {
			type: String,
			required: true,
			enum: ["pending", "sent", "failed"],
			default: "pending",
		},
		flowRunId: { type: String },
		externalMessageId: { type: String },
		error: { type: String },
	},
	{
		timestamps: true,
	}
);

// Create compound index for efficient queries
MessageSchema.index({ customerId: 1, chatId: 1, integrationId: 1 });
MessageSchema.index({ customerId: 1, integrationId: 1 });

export const Message =
	mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
