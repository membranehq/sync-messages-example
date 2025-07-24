import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { getAuthFromRequest } from "@/lib/server-auth";
import { getIntegrationClient } from "@/lib/integration-app-client";

interface SendMessageRequest {
	message: string;
	chatId: string;
	integrationId: string;
	recipient?: string;
	chatName?: string;
	chatType?: "direct" | "group" | "channel";
	platformName?: string;
	messageType?: "text" | "image" | "file" | "reaction" | "system";
}

interface SendMessageResponse {
	success: boolean;
	messageId?: string;
	flowRunId?: string;
	error?: string;
}

interface FlowRunStatus {
	id: string;
	status: "running" | "completed" | "failed";
	output?: any;
	error?: string;
}

interface WebhookPayload {
	flowRunId: string;
	status: "completed" | "failed";
	output?: any;
	error?: string;
	internalMessageId?: string;
	externalMessageId?: string;
}

export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body: SendMessageRequest = await request.json();
		const {
			message,
			chatId,
			integrationId,
			recipient,
			chatName,
			chatType,
			platformName,
			messageType = "text",
		} = body;

		// Validate required fields
		if (!message || !chatId || !integrationId) {
			return NextResponse.json(
				{ error: "Missing required fields: message, chatId, integrationId" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Get Integration.app client
		const client = await getIntegrationClient(auth);

		try {
			// Step 1: Run the flow to send message
			console.log(`Running flow to send message to chat ${chatId}`);

			// Generate unique message ID for tracking
			const internalMessageId = `msg-${Date.now()}-${Math.random()}`;

			// Prepare the input data according to the required structure
			const input = {
				type: "created",
				data: {
					content: message,
					sender: auth.customerId, // Using customerId as sender for now
					recipient: recipient || chatId, // Use recipient if provided, otherwise use chatId
					chatId: chatId,
					chatName: chatName || "Chat",
					chatType: chatType || "direct",
					platformId: integrationId,
					platformName: platformName || "Unknown",
					messageType: messageType,
					status: "pending",
					sentTime: new Date().toISOString(),
					createdTime: new Date().toISOString(),
					createdBy: auth.customerId,
					updatedTime: new Date().toISOString(),
					updatedBy: auth.customerId,
				},
				customerId: auth.customerId,
				internalMessageId: internalMessageId,
				externalMessageId: "", // Will be filled by the flow
			};

			const flowRun = await client
				.connection(integrationId)
				.flow("send-message-events")
				.run({
					input,
				});

			const flowRunId = flowRun.id;
			console.log(`Flow run started with ID: ${flowRunId}`);

			// Step 2: Save message to MongoDB with pending status
			const messageToSave = {
				id: internalMessageId,
				content: message,
				sender: "You",
				timestamp: new Date().toISOString(),
				chatId: chatId,
				integrationId: integrationId,
				platformName: platformName || "Unknown",
				status: "pending" as const,
				flowRunId: flowRunId,
			};

			const savedMessage = await Message.create({
				...messageToSave,
				customerId: auth.customerId,
			});

			console.log(`Message saved to MongoDB with ID: ${savedMessage.id}`);

			// Step 3: Return immediately with flow run ID
			// The webhook will handle updating the message status when flow completes
			return NextResponse.json({
				success: true,
				messageId: savedMessage.id,
				flowRunId: flowRunId,
				status: "pending",
			});
		} catch (flowError) {
			console.error("Error running flow:", flowError);
			return NextResponse.json({
				success: false,
				error: "Failed to execute flow",
			});
		}
	} catch (error) {
		console.error("Error sending message:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}

/**
 * Webhook endpoint for Integration.app to call when flow completes
 */
export async function PUT(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body: WebhookPayload = await request.json();
		const {
			flowRunId,
			status,
			output,
			error,
			internalMessageId,
			externalMessageId,
		} = body;

		console.log(
			`Webhook received for flow run ${flowRunId} with status: ${status}`
		);

		await connectDB();

		// Find the message by flow run ID
		const message = await Message.findOne({
			flowRunId: flowRunId,
			customerId: auth.customerId,
		});

		if (!message) {
			console.error(`Message not found for flow run ID: ${flowRunId}`);
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		// Update message status based on flow completion
		if (status === "completed") {
			await Message.findOneAndUpdate(
				{ _id: message._id },
				{
					status: "sent",
					externalMessageId: externalMessageId || "",
					updatedAt: new Date(),
				}
			);

			console.log(`Message ${message.id} marked as sent successfully`);
		} else if (status === "failed") {
			await Message.findOneAndUpdate(
				{ _id: message._id },
				{
					status: "failed",
					error: error || "Flow execution failed",
					updatedAt: new Date(),
				}
			);

			console.log(`Message ${message.id} marked as failed: ${error}`);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Failed to process webhook" },
			{ status: 500 }
		);
	}
}

/**
 * Poll for flow run completion
 * This function will check the flow run status until it completes or fails
 */
async function pollFlowRunCompletion(
	client: any,
	flowRunId: string,
	maxAttempts: number = 30, // 30 seconds max
	pollInterval: number = 1000 // 1 second intervals
): Promise<FlowRunStatus> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			console.log(
				`Checking flow run status (attempt ${attempt + 1}/${maxAttempts})`
			);

			// Get flow run output
			const flowRun = await client.flowRun(flowRunId).getOutput();

			console.log(`Flow run status:`, flowRun);

			// Check if flow is completed
			if (flowRun.status === "completed") {
				return {
					id: flowRunId,
					status: "completed",
					output: flowRun.output,
				};
			}

			// Check if flow failed
			if (flowRun.status === "failed") {
				return {
					id: flowRunId,
					status: "failed",
					error: flowRun.error || "Flow execution failed",
				};
			}

			// If still running, wait and try again
			if (flowRun.status === "running") {
				console.log(`Flow still running, waiting ${pollInterval}ms...`);
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
				continue;
			}

			// Unknown status
			return {
				id: flowRunId,
				status: "failed",
				error: `Unknown flow status: ${flowRun.status}`,
			};
		} catch (error) {
			console.error(
				`Error checking flow run status (attempt ${attempt + 1}):`,
				error
			);

			// If we've tried enough times, give up
			if (attempt === maxAttempts - 1) {
				return {
					id: flowRunId,
					status: "failed",
					error: "Timeout waiting for flow completion",
				};
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}
	}

	return {
		id: flowRunId,
		status: "failed",
		error: "Timeout waiting for flow completion",
	};
}
