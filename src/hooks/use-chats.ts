import useSWR from "swr";
import { ChatsResponse } from "@/types/message";
import { authenticatedFetcher } from "@/lib/fetch-utils";

export function useChats() {
	const { data, error, isLoading, mutate } = useSWR<ChatsResponse>(
		"/api/chats",
		(url) => authenticatedFetcher<ChatsResponse>(url),
		{
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
			refreshInterval: 30000, // Refresh every 30 seconds
		}
	);

	return {
		chats: data?.chats ?? [],
		isLoading,
		isError: error,
		mutate,
	};
}
