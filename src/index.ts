import { items, type Items } from "./items.ts";

export type { Items };

export function createClient({ baseUrl }: { baseUrl: string }) {
	const client = {
		items: items(baseUrl),
	};

	return client;
}
