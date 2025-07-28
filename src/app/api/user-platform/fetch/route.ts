import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserPlatform } from "@/models/user-platform";
import { getAuthFromRequest } from "@/lib/server-auth";
import { getIntegrationClient } from "@/lib/integration-app-client";

export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Get Integration.app client
		const client = await getIntegrationClient(auth);

		// Get all connections for this user
		const connectionsResponse = await client.connections.find();
		const connections = connectionsResponse.items || [];

		if (connections.length === 0) {
			return NextResponse.json(
				{ error: "No platforms connected" },
				{ status: 400 }
			);
		}

		const results = [];

		// Process each connection
		for (const connection of connections) {
			try {
				console.log(
					`Fetching user info from ${connection.name} (${connection.id})`
				);

				// Fetch user information from the platform
				const userResult = await client
					.connection(connection.id)
					.action("get-user")
					.run();

				console.log(`🔍 Raw user result for ${connection.name}:`, {
					hasOutput: !!userResult.output,
					hasRecords: !!userResult.output?.records,
					recordsLength: userResult.output?.records?.length || 0,
					output: userResult.output,
				});

				// Check if data is in records array or directly in output
				let userData: Record<string, unknown>;

				if (
					userResult.output?.records &&
					userResult.output.records.length > 0
				) {
					// Data is in records array
					userData = userResult.output.records[0] as Record<string, unknown>;
				} else if (userResult.output && typeof userResult.output === "object") {
					// Data is directly in output object
					userData = userResult.output as Record<string, unknown>;
				} else {
					console.log(`⚠️ No user data found for ${connection.name}`);
					results.push({
						platformId: connection.id,
						platformName: connection.name,
						success: false,
						error: "No user data found",
					});
					continue;
				}

				// Extract user information based on expected format: { userId: "U0976R40534", platform: "Slack" }
				const externalUserId =
					(userData.userId as string) ||
					(userData.id as string) ||
					(userData.user_id as string) ||
					(userData.externalUserId as string) ||
					`unknown-${connection.id}-${Date.now()}`; // Make unknown IDs unique per connection

				// Use platform from the response or fallback to connection name
				const platformName =
					(userData.platform as string) || connection.name || connection.id;

				const externalUserName =
					(userData.name as string) ||
					(userData.username as string) ||
					(userData.displayName as string) ||
					(userData.display_name as string) ||
					(userData.realName as string) ||
					(userData.real_name as string) ||
					undefined;

				const externalUserEmail =
					(userData.email as string) || (userData.mail as string) || undefined;

				console.log(`User info from ${connection.name}:`, {
					externalUserId,
					platformName,
					externalUserName,
					externalUserEmail,
				});

				// Upsert user platform record
				// This stores the mapping between our customerId and the external platform's userId
				// This is used to identify which messages were sent by the current user vs others
				// when importing messages from platforms
				await UserPlatform.findOneAndUpdate(
					{
						customerId: auth.customerId,
						platformId: connection.id,
					},
					{
						customerId: auth.customerId, // Our internal customer ID
						platformId: connection.id,
						platformName: platformName, // Use platform name from response
						externalUserId, // External platform's user ID (e.g., "U0976R40534" for Slack)
						externalUserName,
						externalUserEmail,
						connectionId: connection.id,
						lastSynced: new Date(),
					},
					{ upsert: true, new: true }
				);

				results.push({
					platformId: connection.id,
					platformName: platformName, // Use platform name from response
					externalUserId,
					externalUserName,
					externalUserEmail,
					success: true,
				});

				console.log(`✅ Stored user platform info for ${connection.name}`);
			} catch (error) {
				console.error(
					`❌ Error fetching user info from ${connection.name}:`,
					error
				);

				// Check if it's an action not found error
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				if (
					errorMessage.includes("not found") ||
					errorMessage.includes("404")
				) {
					console.log(
						`⚠️ Action 'get-user' not available for ${connection.name}`
					);
				}

				results.push({
					platformId: connection.id,
					platformName: connection.name,
					success: false,
					error: errorMessage,
				});
			}
		}

		return NextResponse.json({
			success: true,
			results,
			totalProcessed: results.length,
			successful: results.filter((r) => r.success).length,
		});
	} catch (error) {
		console.error("Error fetching user platform info:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user platform info" },
			{ status: 500 }
		);
	}
}
