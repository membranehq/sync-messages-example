import { getAuthHeaders } from "@/lib/fetch-utils";

export function useSyncMessages() {
	const syncMessages = async () => {
		try {
			const response = await fetch("/api/messages/sync", {
				method: "POST",
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				throw new Error("Failed to sync messages");
			}

			const result = await response.json();
			return result;
		} catch (error) {
			console.error("Error syncing messages:", error);
			throw error;
		}
	};

	return {
		syncMessages,
	};
}
