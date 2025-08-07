import "./globals.css";
import { ThemeProvider } from "@/app/providers";
import { inter } from "@/app/fonts";
import { IntegrationProvider } from "./integration-provider";
import { AuthProvider } from "./auth-provider";
import { IntegrationProvider as AppIntegrationProvider } from "@/contexts/integration-context";
import { Banner } from "@/components/banner";

export const metadata = {
	title: {
		default: "Messages Sync Template",
		template: "%s | Use Case Template",
	},
	description: "Integration.app Messages Sync Template Application",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.className} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<AuthProvider>
						<IntegrationProvider>
							<AppIntegrationProvider>
								<Banner />
								<main className="h-[calc(100vh-40px)]">{children}</main>
							</AppIntegrationProvider>
						</IntegrationProvider>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
