import {
	extractTextFromHTML,
	containsHTML,
	isEmailContent,
	decodeUTF8Text,
} from "./html-processor";

/**
 * Utility functions for message handling
 */

/**
 * Gets the display name for a message sender, with fallback logic
 * @param message - The message object containing sender and ownerName
 * @returns The display name to show for the sender
 */
export function getMessageSenderName(message: {
	sender: string;
	ownerName?: string;
}): string {
	// Prefer ownerName if available, otherwise fall back to sender
	return message.ownerName || message.sender;
}

/**
 * Gets the display content for a message, processing HTML if needed
 * @param content - The raw message content
 * @returns Processed content suitable for display
 */
export function getMessageDisplayContent(content: string): string {
	if (!content) return "";

	let processedContent = content;

	// If content contains HTML, extract readable text
	if (containsHTML(content)) {
		processedContent = extractTextFromHTML(content);
	}

	// Apply UTF-8 decoding to fix character encoding issues
	processedContent = decodeUTF8Text(processedContent);

	return processedContent;
}

/**
 * Gets a preview of message content, truncating if needed
 * @param content - The raw message content
 * @param maxLength - Maximum length for preview
 * @returns Truncated content suitable for preview
 */
export function getMessagePreview(
	content: string,
	maxLength: number = 100
): string {
	if (!content) return "";

	const displayContent = getMessageDisplayContent(content);

	if (displayContent.length <= maxLength) {
		return displayContent;
	}

	return displayContent.substring(0, maxLength) + "...";
}

/**
 * Checks if a message contains HTML content
 * @param content - The message content to check
 * @returns True if the content contains HTML
 */
export function isHTMLMessage(content: string): boolean {
	return containsHTML(content);
}

/**
 * Checks if a message is an email
 * @param content - The message content to check
 * @returns True if the content appears to be an email
 */
export function isEmailMessage(content: string): boolean {
	return isEmailContent(content);
}

/**
 * Determines if a message should show the sender name based on grouping logic
 * Only shows names for incoming messages, not outgoing ones
 * @param messages - Array of all messages
 * @param currentIndex - Index of the current message
 * @returns True if the sender name should be displayed
 */
export function shouldShowSenderName(
	messages: Array<{
		sender: string;
		direction: "incoming" | "outgoing";
	}>,
	currentIndex: number
): boolean {
	const currentMessage = messages[currentIndex];

	// Only show names for incoming messages
	if (currentMessage.direction !== "incoming") {
		return false;
	}

	if (currentIndex === 0) return true; // Always show for the first message

	const previousMessage = messages[currentIndex - 1];

	if (!previousMessage) return true; // Should not happen if index > 0

	// Show name if previous message was from different sender or was outgoing
	return (
		previousMessage.sender !== currentMessage.sender ||
		previousMessage.direction === "outgoing"
	);
}
