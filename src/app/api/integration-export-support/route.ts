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

		// Check if the response indicates support for export
		// A 200 status means the endpoint exists and supports export
		// A 404 status means the endpoint doesn't exist (no export support)
		const supportsExport = response.status === 200;

		return NextResponse.json({ supportsExport });
	} catch (error) {
		console.error("Error checking integration export support:", error);
		return NextResponse.json(
			{ error: "Failed to check export support" },
			{ status: 500 }
		);
	}
}
