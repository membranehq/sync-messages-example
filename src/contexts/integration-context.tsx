"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Integration as IntegrationAppIntegration } from "@integration-app/sdk";

interface IntegrationContextType {
	selectedIntegration: IntegrationAppIntegration | null;
	setSelectedIntegration: (
		integration: IntegrationAppIntegration | null
	) => void;
	exportSupportMap: Record<string, boolean>;
	setExportSupportMap: (
		map:
			| Record<string, boolean>
			| ((prev: Record<string, boolean>) => Record<string, boolean>)
	) => void;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(
	undefined
);

export function IntegrationProvider({ children }: { children: ReactNode }) {
	const [selectedIntegration, setSelectedIntegration] =
		useState<IntegrationAppIntegration | null>(null);
	const [exportSupportMap, setExportSupportMap] = useState<
		Record<string, boolean>
	>({});

	return (
		<IntegrationContext.Provider
			value={{
				selectedIntegration,
				setSelectedIntegration,
				exportSupportMap,
				setExportSupportMap,
			}}
		>
			{children}
		</IntegrationContext.Provider>
	);
}

export function useIntegrationContext() {
	const context = useContext(IntegrationContext);
	if (context === undefined) {
		throw new Error(
			"useIntegrationContext must be used within an IntegrationProvider"
		);
	}
	return context;
}
