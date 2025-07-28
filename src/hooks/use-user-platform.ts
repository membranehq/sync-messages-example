import { useState } from "react";
import { getAuthHeaders } from "@/lib/fetch-utils";

interface UserPlatformResult {
	platformId: string;
	platformName: string;
	externalUserId?: string;
	externalUserName?: string;
	externalUserEmail?: string;
	success: boolean;
	error?: string;
}

interface FetchUserPlatformResponse {
	success: boolean;
	results: UserPlatformResult[];
	totalProcessed: number;
	successful: number;
}

export function useUserPlatform() {
	const [isFetching, setIsFetching] = useState(false);
	const [lastFetchResult, setLastFetchResult] =
		useState<FetchUserPlatformResponse | null>(null);

	const fetchUserPlatformInfo = async () => {
		try {
			setIsFetching(true);
			console.log("🔄 Fetching user platform info...");

			const response = await fetch("/api/user-platform/fetch", {
				method: "POST",
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to fetch user platform info"
				);
			}

			const result = await response.json();
			console.log("✅ User platform info fetched:", result);

			setLastFetchResult(result);
			return result;
		} catch (error) {
			console.error("❌ Error fetching user platform info:", error);
			throw error;
		} finally {
			setIsFetching(false);
		}
	};

	return {
		fetchUserPlatformInfo,
		isFetching,
		lastFetchResult,
	};
}
