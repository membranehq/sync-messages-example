import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
	id: string;
	content: string;
	sender: string;
	timestamp: string;
	chatId?: string;
	integrationId: string;
	platformName?: string;
	customerId: string;
	createdAt: Date;
	updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
	{
		id: { type: String, required: true },
		content: { type: String, required: true },
		sender: { type: String, required: true },
		timestamp: { type: String, required: true },
		chatId: { type: String },
		integrationId: { type: String, required: true },
		platformName: { type: String },
		customerId: { type: String, required: true },
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
