import useSWR from "swr";
import { MessagesResponse } from "@/types/message";
import { authenticatedFetcher } from "@/lib/fetch-utils";

export function useMessages() {
	const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
		"/api/messages",
		(url) => authenticatedFetcher<MessagesResponse>(url),
		{
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
			refreshInterval: 30000, // Refresh every 30 seconds
		}
	);

	return {
		messages: data?.messages ?? [],
		isLoading,
		isError: error,
		mutate,
	};
}
