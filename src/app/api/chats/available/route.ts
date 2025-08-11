import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/server-auth";
import { getIntegrationClient } from "@/lib/integration-app-client";

interface ChatRecord {
	id?: string;
	name?: string;
	title?: string;
	subject?: string;
	participants?: string[];
	members?: string[];
	last_message?: string;
	recent_message?: string;
	last_message_time?: string;
	updated_at?: string;
	fields?: {
		id?: string;
		name?: string;
		participants?: string[];
		members?: string[];
		last_message?: string;
		updated?: string;
	};
	rawFields?: {
		name?: string;
		ts?: string;
	};
}

export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { integrationKey } = body;

		if (!integrationKey) {
			return NextResponse.json(
				{ error: "integrationKey is required" },
				{ status: 400 }
			);
		}

		// Get Integration.app client
		const client = await getIntegrationClient(auth);

		// Get available chats from the integration
		const chatsResult = await client
			.connection(integrationKey)
			.action("get-chats")
			.run({
				cursor: "", // Start from beginning
			});

		if (chatsResult.output?.records) {
			const availableChats = chatsResult.output.records.map(
				(chat: ChatRecord) => ({
					id: chat.id || chat.fields?.id,
					name:
						chat.fields?.name ||
						chat.rawFields?.name ||
						chat.name ||
						chat.title ||
						chat.subject ||
						"Unnamed Chat",
					participants:
						chat.participants ||
						chat.members ||
						chat.fields?.participants ||
						chat.fields?.members ||
						[],
					lastMessage:
						chat.last_message ||
						chat.recent_message ||
						chat.fields?.last_message,
					lastMessageTime:
						chat.last_message_time ||
						chat.updated_at ||
						chat.fields?.updated ||
						chat.rawFields?.ts,
				})
			);

			return NextResponse.json({ chats: availableChats });
		} else {
			return NextResponse.json({ chats: [] });
		}
	} catch (error) {
		console.error("Error fetching available chats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch available chats" },
			{ status: 500 }
		);
	}
}
