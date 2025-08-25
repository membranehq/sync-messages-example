import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserPlatform } from "@/models/user-platform";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Find all UserPlatform records for this customer
		const allRecords = await UserPlatform.find({
			customerId: auth.customerId,
		}).sort({ createdAt: 1 });

		console.log(
			`Found ${allRecords.length} UserPlatform records for customer ${auth.customerId}`
		);

		const results = [];
		const processedPlatformIds = new Set();

		// Process each record
		for (const record of allRecords) {
			// Determine the correct platformId based on platformName
			let correctPlatformId = record.platformId;

			// Map platform names to standard platform IDs
			if (record.platformName?.toLowerCase().includes("slack")) {
				correctPlatformId = "slack";
			} else if (record.platformName?.toLowerCase().includes("whatsapp")) {
				correctPlatformId = "whatsapp";
			} else if (record.platformName?.toLowerCase().includes("discord")) {
				correctPlatformId = "discord";
			} else {
				// Use platformName as fallback
				correctPlatformId =
					record.platformName?.toLowerCase() || record.platformId;
			}

			const platformKey = `${correctPlatformId}-${auth.customerId}`;

			if (processedPlatformIds.has(platformKey)) {
				// This is a duplicate, delete it
				console.log(
					`🗑️ Deleting duplicate record for platform ${correctPlatformId}: ${record._id}`
				);
				await UserPlatform.findByIdAndDelete(record._id);
				results.push({
					action: "deleted",
					platformId: correctPlatformId,
					recordId: record._id,
					reason: "duplicate",
				});
			} else {
				// First occurrence of this platformId, keep it but ensure importNew is true and platformId is correct
				processedPlatformIds.add(platformKey);

				const updates: {
					importNew?: boolean;
					platformId?: string;
				} = {};
				let needsUpdate = false;

				if (record.importNew === false) {
					updates.importNew = true;
					needsUpdate = true;
				}

				if (record.platformId !== correctPlatformId) {
					updates.platformId = correctPlatformId;
					needsUpdate = true;
				}

				if (needsUpdate) {
					console.log(
						`✅ Updating record for platform ${correctPlatformId}: ${record._id}`,
						updates
					);
					await UserPlatform.findByIdAndUpdate(record._id, updates);
					results.push({
						action: "updated",
						platformId: correctPlatformId,
						recordId: record._id,
						reason: "standardized platformId and importNew",
					});
				} else {
					results.push({
						action: "kept",
						platformId: correctPlatformId,
						recordId: record._id,
						reason: "already correct",
					});
				}
			}
		}

		// Get final count
		const finalCount = await UserPlatform.countDocuments({
			customerId: auth.customerId,
		});

		return NextResponse.json({
			success: true,
			message: `Cleanup completed. ${finalCount} records remaining.`,
			results,
			processed: allRecords.length,
			finalCount,
		});
	} catch (error) {
		console.error("Error cleaning up UserPlatform records:", error);
		return NextResponse.json(
			{ error: "Failed to cleanup UserPlatform records" },
			{ status: 500 }
		);
	}
}
