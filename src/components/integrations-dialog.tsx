"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { IntegrationList } from "@/app/integrations/components/integrations-list";

interface IntegrationsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function IntegrationsDialog({
	open,
	onOpenChange,
}: IntegrationsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Manage Integrations</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<IntegrationList />
				</div>
			</DialogContent>
		</Dialog>
	);
}
