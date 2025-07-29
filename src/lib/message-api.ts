import { getAuthHeaders } from "./fetch-utils";

/**
 * Placeholder API function for sending messages to third-party systems
 * This can be replaced with actual Integration.app API calls
 */

export interface SendMessageRequest {
	message: string;
	chatId: string;
	integrationId?: string;
	recipient?: string;
	chatName?: string;
	chatType?: "direct" | "group" | "channel";
	platformName?: string;
	messageType?: "text" | "image" | "file" | "reaction" | "system";
	messageId?: string; // Optional: for retrying existing messages
}

export interface SendMessageResponse {
	success: boolean;
	messageId?: string;
	status?: "pending" | "sent" | "failed";
	externalMessageId?: string;
	error?: string;
}

/**
 * Send a message to a third-party system via API
 * This calls our backend endpoint which handles Integration.app flow execution
 */
export async function sendMessageToThirdParty(
	request: SendMessageRequest
): Promise<SendMessageResponse> {
	try {
		const response = await fetch("/api/messages/send", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify({
				message: request.message,
				chatId: request.chatId,
				integrationId: request.integrationId,
				recipient: request.recipient,
				chatName: request.chatName,
				chatType: request.chatType,
				platformName: request.platformName,
				messageType: request.messageType,
				messageId: request.messageId, // Add messageId for retries
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to send message");
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error sending message to third-party system:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Validate message before sending
 */
export function validateMessage(message: string): {
	isValid: boolean;
	error?: string;
} {
	if (!message || message.trim().length === 0) {
		return { isValid: false, error: "Message cannot be empty" };
	}

	if (message.length > 1000) {
		return {
			isValid: false,
			error: "Message is too long (max 1000 characters)",
		};
	}

	return { isValid: true };
}
