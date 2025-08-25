import { IntegrationAppClient } from "@integration-app/sdk";
import { generateIntegrationToken } from "./integration-token";
import type { AuthCustomer } from "./auth";

let clientInstance: IntegrationAppClient | null = null;

export class IntegrationClientError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "IntegrationClientError";
	}
}

export async function getIntegrationClient(
	auth: AuthCustomer
): Promise<IntegrationAppClient> {
	try {
		// Generate a fresh token for the customer
		const token = await generateIntegrationToken(auth);

		// Create a new client instance with the fresh token
		// We create a new instance each time to ensure we're using a fresh token
		const client = new IntegrationAppClient({
			token,
		});

		return client;
	} catch (error) {
		console.error("Failed to initialize Integration.app client:", error);
		throw new IntegrationClientError(
			error instanceof Error
				? error.message
				: "Failed to initialize Integration.app client"
		);
	}
}

/**
 * Check if an integration supports chat export by testing the get-chats/export endpoint
 */
export async function checkIntegrationSupportsChatExport(
	integrationKey: string
): Promise<boolean> {
	try {
		console.log(
			`Making API request to check export support for: ${integrationKey}`
		);

		const response = await fetch(
			`/api/integration-export-support?integrationKey=${integrationKey}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			console.error(
				`API request failed for ${integrationKey}: ${response.status}`
			);
			return false;
		}

		const data = await response.json();
		console.log(
			`Export support result for ${integrationKey}: ${data.supportsExport}`
		);
		return data.supportsExport;
	} catch (error) {
		console.error("Error checking integration chat export support:", error);
		// If there's an error, assume it doesn't support export
		return false;
	}
}

/**
 * Use this when you need to ensure a single client instance is reused
 * Note: The token used will be from when the client was first initialized
 */
export async function getSharedIntegrationClient(
	auth: AuthCustomer
): Promise<IntegrationAppClient> {
	if (!clientInstance) {
		clientInstance = await getIntegrationClient(auth);
	}
	return clientInstance;
}

/**
 * Reset the shared client instance, forcing a new one to be created next time
 */
export function resetSharedIntegrationClient(): void {
	clientInstance = null;
}
