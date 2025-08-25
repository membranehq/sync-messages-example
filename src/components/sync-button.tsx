"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

interface SyncButtonProps {
	integrationKey?: string | undefined;
	onSync: () => void;
	isSyncing: boolean;
	className?: string;
	isDisabled?: boolean;
	lastSyncTime?: string | null | undefined;
	status?: string;
	integrationName?: string | undefined;
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

	const tooltipElement = isDisabled && integrationKey && (
		<div className="relative group">
			<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
				<div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
					This connected app doesn&apos;t allow for chats and messages to be
					fetched.
					<br />
					New received messages will be automatically imported.
					<div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-100"></div>
				</div>
			</div>
			<AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 mx-auto mt-1" />
		</div>
	);

	// If showMessage is false, just return the button
	if (!showMessage) {
		return buttonElement;
	}

	// Return both button and tooltip as separate elements
	return (
		<div className="flex flex-col items-center">
			{buttonElement}
			{tooltipElement}
		</div>
	);
}
