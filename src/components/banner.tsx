import { Blocks, ArrowRight } from "lucide-react";

export function Banner() {
	return (
		<div
			className="whitespace-nowrap py-2 text-center text-sm font-semibold text-white"
			style={{ backgroundColor: "#0F172B" }}
		>
			<span className="inline-flex items-center">
				<Blocks className="w-4 h-4 mr-2 align-text-bottom" aria-hidden="true" />
				Start building universal integrations with{" "}
				<a
					href="https://integration.app"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-blue-100 transition-colors font-bold ml-1"
				>
					Membrane
					<ArrowRight className="w-4 h-4 ml-1 inline" aria-hidden="true" />
				</a>
			</span>
		</div>
	);
}
