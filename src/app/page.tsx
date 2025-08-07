import { AuthTest } from "@/components/auth-test";
import { Sidebar } from "@/components/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Overview",
};

export default function HomePage() {
	return (
		<div className="flex h-[calc(100vh-40px)]">
			<Sidebar />
			<div className="flex-1 p-8">
				<div className="flex flex-col gap-4 mb-10">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Overview</h1>
							<p className="text-muted-foreground">
								Welcome to Messages Sync App
							</p>
						</div>
					</div>
				</div>
				<AuthTest />
			</div>
		</div>
	);
}
