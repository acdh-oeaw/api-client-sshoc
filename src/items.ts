import { createUrl, createUrlSearchParams, request } from "@acdh-oeaw/lib";

type IsoDateString = string;
type UrlString = string;

export namespace Items {
	export type Category =
		| "dataset"
		| "publication"
		| "tool-or-service"
		| "training-material"
		| "workflow";

	export type CategoryWithStep = Category | "step";

	export type Status =
		| "approved"
		| "deprecated"
		| "disapproved"
		| "draft"
		| "ingested"
		| "suggested";

	export namespace Search {
		export type SortOrder = "label" | "modified-on" | "score";

		export type Facet = "activity" | "keyword" | "language" | "source";

		export interface ActorSource {
			code: string;
			label: string;
			ord: number;
			/** Uses "{source-actor-id}" as placeholder. */
			urlTemplate: UrlString;
		}

		export interface ActorExternalId {
			identifier: string;
			identifierService: ActorSource;
		}

		export interface Actor {
			affiliations: Array<Actor>;
			email?: string;
			externalIds: Array<ActorExternalId>;
			id: number;
			name: string;
			website?: UrlString;
		}

		export interface ActorRole {
			code: string;
			label: string;
			ord: number;
		}

		export interface Contributor {
			actor: Actor;
			role: ActorRole;
		}

		export interface VocabularyBase {
			accessibleAt: string;
			closed: boolean;
			code: string;
			label: string;
			namespace: string;
			scheme: string;
		}

		interface PropertyTypeBase {
			allowedVocabularies: Array<VocabularyBase>;
			code: string;
			groupName: string;
			hidden: boolean;
			label: string;
			ord: number;
		}

		export interface ConceptPropertyType extends PropertyTypeBase {
			type: "concept";
		}

		export interface ValuePropertyType extends PropertyTypeBase {
			type: "string" | "url" | "int" | "float" | "date" | "boolean";
		}

		export type PropertyType = ConceptPropertyType | ValuePropertyType;

		export interface ConceptBase {
			candidate: boolean;
			code: string;
			definition: string;
			label: string;
			notation: string;
			uri: string;
			vocabulary: VocabularyBase;
		}

		export interface ValueProperty {
			type: ValuePropertyType;
			value: string;
		}

		export interface ConceptProperty {
			concept: ConceptBase;
			type: ConceptPropertyType;
		}

		export type Property = ConceptProperty | ValueProperty;

		export interface ItemBase {
			category: Items.Category;
			id: number;
			label: string;
			lastInfoUpdate: IsoDateString;
			persistentId: string;
		}

		export interface Item extends ItemBase {
			accessibleAt: Array<UrlString>;
			contributors: Array<Contributor>;
			description: string;
			owner: string;
			properties: Array<Property>;
			status: Items.Status;
			thumbnailId: string;
		}

		export interface SearchParams {
			activities?: Array<string>;
			/** @default false */
			advanced?: boolean;
			categories?: Array<Items.Category>;
			/** @default false */
			includeSteps?: boolean;
			keywords?: Array<string>;
			languages?: Array<string>;
			/** @default ["label"] */
			order?: Array<SortOrder>;
			/** @default 1 */
			page?: number;
			/** @default 25 */
			perpage?: number;
			q?: string;
			sources?: Array<string>;
		}

		export interface Response {
			categories: Record<
				Items.Category,
				{
					checked: boolean;
					count: number;
					label: string;
				}
			>;
			count: number;
			facets: Record<
				Items.Search.Facet,
				Record<
					string,
					{
						checked: boolean;
						count: number;
					}
				>
			>;
			hits: number;
			items: Array<Item>;
			order: Array<SortOrder>;
			page: number;
			pages: number;
			perpage: number;
			q?: string;
		}
	}
}

export function items(baseUrl: string) {
	return {
		search(searchParams: Items.Search.SearchParams) {
			const {
				activities,
				advanced,
				categories,
				includeSteps,
				keywords,
				languages,
				order = ["label"],
				page = 1,
				perpage = 25,
				q,
				sources,
			} = searchParams;

			const url = createUrl({
				baseUrl,
				pathname: "/api/item-search",
				searchParams: createUrlSearchParams({
					"f.activity": activities,
					advanced,
					categories,
					includeSteps,
					"f.keyword": keywords,
					"f.language": languages,
					order,
					page,
					perpage,
					q,
					"f.source": sources,
				}),
			});

			return {
				url,
				request() {
					return request(url, { responseType: "json" });
				},
			};
		},
	};
}
