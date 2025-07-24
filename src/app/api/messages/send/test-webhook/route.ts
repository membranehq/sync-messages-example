import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/fetch-utils";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { flowRunId, status, internalMessageId, externalMessageId } = body;

		// Simulate webhook call to our endpoint
		const webhookResponse = await fetch(
			`${request.nextUrl.origin}/api/messages/send`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeaders(),
				},
				body: JSON.stringify({
					flowRunId,
					status,
					internalMessageId,
					externalMessageId,
					output: {
						messageId: externalMessageId,
						status: "sent",
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
		console.error("Error testing webhook:", error);
		return NextResponse.json(
			{ error: "Failed to test webhook" },
			{ status: 500 }
		);
	}
}
