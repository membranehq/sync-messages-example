import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/server-auth";
import { generateIntegrationToken } from "@/lib/integration-token";

export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthFromRequest(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const integrationKey = searchParams.get("integrationKey");

		if (!integrationKey) {
			return NextResponse.json(
				{ error: "Integration key is required" },
				{ status: 400 }
			);
		}

		const token = await generateIntegrationToken(auth);

		console.log(
			`Making API request to check export support for: ${integrationKey}`
		);
		const response = await fetch(
			`https://api.integration.app/integrations/${integrationKey}/actions/get-chats/export`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.log(`Response status for ${integrationKey}: ${response.status}`);

		// If we get a 200 status, check if the response contains valid action data
		if (response.status === 200) {
			const data = await response.json();
			console.log(`Response data for ${integrationKey}:`, data);

			// Check if the response has the expected structure for a valid action
			const isValidAction =
				data && data.key === "get-chats" && data.type === "list-data-records";
			console.log(`Is valid action for ${integrationKey}: ${isValidAction}`);
			return NextResponse.json({ supportsExport: isValidAction });
		}

		// Return false for 404 or any other status
		console.log(
			`Export not supported for ${integrationKey} (status: ${response.status})`
		);
		return NextResponse.json({ supportsExport: false });
	} catch (error) {
		console.error("Error checking integration export support:", error);
		return NextResponse.json(
			{ error: "Failed to check export support" },
			{ status: 500 }
		);
	}
}
