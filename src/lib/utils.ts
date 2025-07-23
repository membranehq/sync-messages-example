import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: string | undefined): string | null {
	if (!timestamp) return null;

	try {
		// Handle Slack timestamp format (e.g., "1753303953.454369")
		if (timestamp.includes(".")) {
			const unixTimestamp = parseFloat(timestamp);
			if (!isNaN(unixTimestamp)) {
				const date = new Date(unixTimestamp * 1000);
				return date.toISOString();
			}
		}

		// Try to parse as ISO string or other format
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			return null;
		}

		return date.toISOString();
	} catch (error) {
		console.error("Error formatting timestamp:", timestamp, error);
		return null;
	}
}
