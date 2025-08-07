import axios from "axios";
import { generateIntegrationToken } from "./integration-token";
import type { AuthCustomer } from "./auth";
import { getMentionPattern } from "./mention-patterns";

// Type definitions for API responses
interface DataLinkTableInstance {
	id: string;
	dataLinkTable?: {
		key: string;
	};
	connectionId: string;
}

interface DataLinkTableLink {
	externalRecordId: string;
	appRecordId: string;
}

// Buffer function to handle rate limiting
const buffer = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

// Cache for user mappings to avoid repeated API calls
const userMappingsCache: Record<string, Record<string, string>> = {};

// Interface for mention patterns
export interface MentionPattern {
	regex: RegExp;
	extractUserId: (match: string) => string;
	formatReplacement: (userName: string) => string;
}

// Helper function to get data link table instance ID
async function getDataLinkTableInstanceId(
	auth: AuthCustomer,
	connectionId: string
) {
	try {
		// Buffer before API call to handle rate limiting
		await buffer(1000);

		// Generate integration token for API calls
		const token = await generateIntegrationToken(auth);

		// Make direct API call to get data link table instances
		const response = await axios.get(
			"https://api.integration.app/data-link-table-instances",
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);

		const instances = response.data.items || [];

		// Find the users data link table instance for this connection
		const usersInstance = instances.find(
			(instance: DataLinkTableInstance) =>
				instance.dataLinkTable?.key === "users" &&
				instance.connectionId === connectionId
		);

		if (usersInstance) {
			console.log(
				`✅ Found users data link table instance: ${usersInstance.id}`
			);
		} else {
			console.log(
				`❌ No users data link table instance found for connection: ${connectionId}`
			);
		}

		return usersInstance?.id;
	} catch (error) {
		console.error("Error fetching data link table instances:", error);
		return null;
	}
}

// Helper function to get user mappings from data link table
async function getUserMappings(
	auth: AuthCustomer,
	dataLinkTableInstanceId: string
) {
	try {
		// Buffer before API call to handle rate limiting
		await buffer(1000);

		// Generate integration token for API calls
		const token = await generateIntegrationToken(auth);

		// Make direct API call to get data link table instance links
		const response = await axios.get(
			`https://api.integration.app/data-link-table-instances/${dataLinkTableInstanceId}/links`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);

		const links = response.data.items || [];

		// Create a mapping from externalRecordId to appRecordId
		const userMappings: Record<string, string> = {};
		links.forEach((link: DataLinkTableLink) => {
			if (link.externalRecordId && link.appRecordId) {
				userMappings[link.externalRecordId] = link.appRecordId;
			}
		});

		console.log(
			`✅ Fetched ${
				Object.keys(userMappings).length
			} user mappings from data link table`
		);
		return userMappings;
	} catch (error) {
		console.error("Error fetching user mappings:", error);
		return {};
	}
}

// Main function to replace mentions in content
export async function replaceMentions(
	content: string,
	auth: AuthCustomer,
	connectionId: string,
	platformName: string
): Promise<string> {
	// Get the mention pattern for this platform
	const mentionPattern = getMentionPattern(platformName);

	if (!mentionPattern) {
		// No mention replacement for unsupported platforms
		return content;
	}

	// Check if content contains mentions
	const mentions = content.match(mentionPattern.regex);
	if (!mentions || mentions.length === 0) {
		return content;
	}

	console.log(
		`🔍 Found ${platformName} mentions in message: ${mentions.join(", ")}`
	);

	try {
		// Check if we already have user mappings for this connection
		const cacheKey = `${connectionId}-${platformName}`;
		let userMappings = userMappingsCache[cacheKey];

		if (!userMappings) {
			// Get data link table instance ID
			const dataLinkTableInstanceId = await getDataLinkTableInstanceId(
				auth,
				connectionId
			);
			if (!dataLinkTableInstanceId) {
				console.warn("Could not find data link table instance for users");
				return content;
			}

			// Get user mappings
			userMappings = await getUserMappings(auth, dataLinkTableInstanceId);
			if (Object.keys(userMappings).length === 0) {
				console.warn("No user mappings found");
				return content;
			}

			// Cache the mappings for future use
			userMappingsCache[cacheKey] = userMappings;
			console.log(
				`📦 Cached user mappings for connection ${connectionId} (${platformName}): ${
					Object.keys(userMappings).length
				} mappings`
			);
		} else {
			console.log(
				`📦 Using cached user mappings for connection ${connectionId} (${platformName})`
			);
		}

		// Replace mentions with user names
		let processedContent = content;
		mentions.forEach((mention) => {
			const userId = mentionPattern.extractUserId(mention);
			if (userId && userMappings[userId]) {
				const userName = userMappings[userId];
				const replacement = mentionPattern.formatReplacement(userName);
				processedContent = processedContent.replace(mention, replacement);
				console.log(`✅ Replaced ${mention} with ${replacement}`);
			}
		});

		return processedContent;
	} catch (error) {
		console.error("Error replacing mentions:", error);
		return content; // Return original content if there's an error
	}
}

// Function to clear the cache (useful for testing or when mappings change)
export function clearMentionCache(): void {
	Object.keys(userMappingsCache).forEach(
		(key) => delete userMappingsCache[key]
	);
	console.log("🧹 Cleared mention replacement cache");
}
