import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/fetch-utils";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			externalMessageId,
			content,
			ownerId,
			chatId,
			platformName = "Slack",
			integrationId = "slack-test",
			customerId = "test-customer",
		} = body;

		// Simulate incoming message webhook call
		const webhookResponse = await fetch(
			`${request.nextUrl.origin}/api/messages/receive`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Integration-App-Token": "test-token",
				},
				body: JSON.stringify({
					externalMessageId,
					data: {
						id: externalMessageId,
						content,
						ownerId,
						chatId,
						timestamp: new Date().toISOString(),
						platformName,
						integrationId,
						customerId,
					},
				}),
			}
		);

		const result = await webhookResponse.json();

		return NextResponse.json({
			success: true,
			webhookResult: result,
		});
	} catch (error) {
		console.error("Error testing incoming message webhook:", error);
		return NextResponse.json(
			{ error: "Failed to test incoming message webhook" },
			{ status: 500 }
		);
	}
}
