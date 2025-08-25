import { useState, useCallback, useRef, useEffect } from "react";
import type { Integration as IntegrationAppIntegration } from "@integration-app/sdk";
import { checkIntegrationSupportsChatExport } from "@/lib/integration-app-client";

export function useIntegrationExportSupport() {
	const [exportSupportMap, setExportSupportMap] = useState<
		Record<string, boolean>
	>({});
	const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

	// Use ref to access current state without stale closure
	const exportSupportMapRef = useRef<Record<string, boolean>>({});
	const loadingMapRef = useRef<Record<string, boolean>>({});

	// Keep refs in sync with state
	useEffect(() => {
		console.log(
			"🔍 Syncing exportSupportMap ref with state:",
			exportSupportMap
		);
		exportSupportMapRef.current = exportSupportMap;
	}, [exportSupportMap]);

	useEffect(() => {
		loadingMapRef.current = loadingMap;
	}, [loadingMap]);

	const checkExportSupport = useCallback(
		async (integration: IntegrationAppIntegration) => {
			if (!integration.key) return;

			console.log("🔍 checkExportSupport called for:", integration.key);
			console.log("🔍 Current exportSupportMap:", exportSupportMapRef.current);

			// If we already checked this integration, return the cached result
			if (exportSupportMapRef.current.hasOwnProperty(integration.key)) {
				console.log(
					`Export support for ${integration.key}: ${
						exportSupportMapRef.current[integration.key]
					} (cached)`
				);
				return exportSupportMapRef.current[integration.key];
			}

			try {
				setLoadingMap((prev) => ({ ...prev, [integration.key]: true }));
				console.log("🔍 Set loading for:", integration.key);

				console.log(
					`Checking export support for integration: ${integration.key}`
				);
				const supportsExport = await checkIntegrationSupportsChatExport(
					integration.key
				);

				console.log(
					`Export support result for ${integration.key}: ${supportsExport}`
				);
				console.log("🔍 Updating exportSupportMap with:", {
					[integration.key]: supportsExport,
				});
				setExportSupportMap((prev) => {
					const newMap = { ...prev, [integration.key]: supportsExport };
					console.log("🔍 New exportSupportMap:", newMap);
					console.log("🔍 Previous exportSupportMap:", prev);
					// Immediately update the ref
					exportSupportMapRef.current = newMap;
					console.log(
						"🔍 Updated ref immediately:",
						exportSupportMapRef.current
					);
					return newMap;
				});

				// Force a re-render by triggering state update
				setTimeout(() => {
					console.log(
						"🔍 Forcing re-render, current ref state:",
						exportSupportMapRef.current
					);
				}, 100);

				return supportsExport;
			} catch (error) {
				console.error(
					"Error checking export support for integration:",
					integration.key,
					error
				);
				setExportSupportMap((prev) => ({ ...prev, [integration.key]: false }));
				return false;
			} finally {
				setLoadingMap((prev) => ({ ...prev, [integration.key]: false }));
				console.log("🔍 Cleared loading for:", integration.key);
			}
		},
		[]
	); // No dependencies needed since we use refs

	const getExportSupport = useCallback(
		(integrationKey: string): boolean | undefined => {
			console.log(
				"🔍 getExportSupport called for:",
				integrationKey,
				"result:",
				exportSupportMapRef.current[integrationKey]
			);
			return exportSupportMapRef.current[integrationKey];
		},
		[] // No dependencies needed since we use refs
	);

	const isLoading = useCallback(
		(integrationKey: string): boolean => {
			return loadingMapRef.current[integrationKey] ?? false;
		},
		[] // No dependencies needed since we use refs
	);

	const clearCache = useCallback(() => {
		setExportSupportMap({});
		setLoadingMap({});
	}, []);

	return {
		checkExportSupport,
		getExportSupport,
		isLoading,
		clearCache,
	};
}
