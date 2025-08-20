"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteChat } from "@/lib/message-api";

interface DeleteChatDialogProps {
	isOpen: boolean;
	onClose: () => void;
	chatId: string;
	chatName: string;
	onDeleteSuccess: () => void;
}

export function DeleteChatDialog({
	isOpen,
	onClose,
	chatId,
	chatName,
	onDeleteSuccess,
}: DeleteChatDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			const result = await deleteChat(chatId);

			if (result.success) {
				onDeleteSuccess();
				onClose();
			} else {
				console.error("Failed to delete chat:", result.error);
				// You could add a toast notification here
			}
		} catch (error) {
			console.error("Error deleting chat:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center space-x-2">
						<div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
							<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
						</div>
						<DialogTitle className="text-red-600 dark:text-red-400">
							Delete Chat
						</DialogTitle>
					</div>
					<DialogDescription className="text-left">
						Are you sure you want to delete{" "}
						<strong>&quot;{chatName}&quot;</strong>? This action will
						permanently remove the chat and all its associated messages from
						your local database. This action cannot be undone.
					</DialogDescription>
					<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
						<p className="text-xs text-blue-700 dark:text-blue-300">
							<strong>Note:</strong> This will only delete the local copy of the
							chat and messages. The original data will remain intact on the
							connected platform (Slack, Teams, etc.).
						</p>
					</div>
				</DialogHeader>
				<DialogFooter className="flex space-x-2">
					<Button variant="outline" onClick={onClose} disabled={isDeleting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-red-600 hover:bg-red-700 text-white"
					>
						{isDeleting ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Chat
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
