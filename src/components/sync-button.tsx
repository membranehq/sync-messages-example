"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { checkIntegrationSupportsChatExport } from "@/lib/integration-app-client";

interface SyncButtonProps {
	integrationKey?: string | undefined;
	onSync: () => void;
	isSyncing: boolean;
	className?: string;
	isDisabled?: boolean;
	lastSyncTime?: string | null | undefined;
	status?: string;
	integrationName?: string;
	buttonText?: string;
	showMessage?: boolean;
}

export function SyncButton({
	integrationKey,
	onSync,
	isSyncing,
	className,
	isDisabled,
	lastSyncTime,
	status,
	integrationName,
	buttonText,
	showMessage = true,
}: SyncButtonProps) {
	const buttonDisabled = isSyncing || isDisabled;

	// Determine button text
	const getButtonText = () => {
		if (isSyncing) return `Syncing... (${status || ""})`;
		if (buttonText) return buttonText;
		if (integrationName) return `Sync ${integrationName}`;
		return "Sync Messages";
	};

	// Determine title
	const getTitle = () => {
		if (lastSyncTime) {
			return `Last synced: ${new Date(lastSyncTime).toLocaleString()}`;
		}
		return "No previous sync";
	};

	const buttonElement = (
		<Button
			onClick={onSync}
			disabled={buttonDisabled}
			variant="outline"
			className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 ${
				className || ""
			}`}
			title={getTitle()}
		>
			{isSyncing ? (
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			) : (
				<Download className="mr-2 h-4 w-4" />
			)}
			{getButtonText()}
		</Button>
	);

	const messageElement = isDisabled && integrationKey && (
		<p className="text-xs text-red-600 dark:text-red-400 text-center">
			This connected app doesn&apos;t allow for chats and messages to be
			fetched.
			<br />
			<span className="text-green-600 dark:text-green-400">
				New received messages will be automatically imported.
			</span>
		</p>
	);

	// If showMessage is false, just return the button
	if (!showMessage) {
		return buttonElement;
	}

	// Return both button and message as separate elements
	return (
		<>
			{buttonElement}
			{messageElement}
		</>
	);
}
