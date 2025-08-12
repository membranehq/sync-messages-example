"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { Sidebar } from "@/components/sidebar";

export default function HomePage() {
	const { customerId, customerName } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// If user is authenticated (has customerId and customerName), redirect to messages
		if (customerId && customerName) {
			router.replace("/messages");
		}
	}, [customerId, customerName, router]);

	// Show loading or auth setup if not authenticated
	if (!customerId || !customerName) {
		return (
			<div className="flex h-[calc(100vh-40px)]">
				<Sidebar />
				<div className="flex-1 p-8">
					<div className="flex flex-col gap-4 mb-10">
						<div className="flex justify-between items-center">
							<div>
								<h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
								<p className="text-muted-foreground">
									Setting up your account...
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
							<p className="text-gray-600 dark:text-gray-400">
								Preparing your workspace...
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// This should never be reached due to the redirect, but just in case
	return null;
}
