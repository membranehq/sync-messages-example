import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTimestamp(
	timestamp: string | number | undefined
): string | null {
	if (!timestamp) return null;

	try {
		// Convert to string if it's a number
		const timestampStr = String(timestamp);

		// Handle Slack timestamp format (e.g., "1753303953.454369")
		if (timestampStr.includes(".")) {
			const unixTimestamp = parseFloat(timestampStr);
			if (!isNaN(unixTimestamp)) {
				const date = new Date(unixTimestamp * 1000);
				return date.toISOString();
			}
		}

		// Handle numeric timestamps (milliseconds since epoch)
		if (!isNaN(Number(timestampStr)) && timestampStr.length > 10) {
			const numericTimestamp = Number(timestampStr);
			const date = new Date(numericTimestamp);
			if (!isNaN(date.getTime())) {
				return date.toISOString();
			}
		}

		// Try to parse as ISO string or other format
		const date = new Date(timestampStr);
		if (isNaN(date.getTime())) {
			return null;
		}

		return date.toISOString();
	} catch (error) {
		console.error("Error formatting timestamp:", timestamp, error);
		return null;
	}
}
