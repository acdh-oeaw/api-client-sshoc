import { createUrl, createUrlSearchParams, request } from "@acdh-oeaw/lib";

type BooleanString = "false" | "true";
type IsoDateString = string;
type UrlString = string;

export const itemFacets = ["activity", "keyword", "source", "language"] as const;

export type ItemFacet = (typeof itemFacets)[number];

export const itemSortOrders = ["score", "label", "modified-on"] as const;

export type ItemSortOrder = (typeof itemSortOrders)[number];

export const itemStatus = [
	"approved",
	"deprecated",
	"disapproved",
	"draft",
	"ingested",
	"suggested",
] as const;

export const itemDraftSortOrders = ["label", "modified-on"] as const;

export type ItemDraftSortOrder = (typeof itemDraftSortOrders)[number];

export type ItemStatus = (typeof itemStatus)[number];

export namespace Items {
	export type Category =
		| "dataset"
		| "publication"
		| "tool-or-service"
		| "training-material"
		| "workflow";

	export type CategoryWithStep = Category | "step";

	export type Status = ItemStatus;

	export namespace Autocomplete {
		export interface SearchParams {
			category?: Items.Category;
			/** Must not be empty. */
			q: string;
		}

		export interface Response {
			phrase: string;
			suggestions: Array<{
				phrase: string;
				persistentId: string;
			}>;
		}
	}

	export namespace Search {
		export type SortOrder = ItemSortOrder;

		export type Facet = ItemFacet;

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

		export function isConceptProperty(value: Property): value is ConceptProperty {
			return value.type.type === "concept";
		}

		export function isValueProperty(value: Property): value is ValueProperty {
			return value.type.type !== "concept";
		}

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

		/**
		 * All fields indexed in `solr` can be queried via params prefixed with "d".
		 * Dashes in field names need to be replaced with underscores.
		 * Solr query syntax is supported, e.g. `d.status: '(suggested OR ingested)'`.
		 *
		 * @see {@link https://github.com/ssHOC/sshoc-marketplace-backend/issues/102}
		 * @see {@link https://github.com/SSHOC/sshoc-marketplace-backend/blob/develop/etc/solr/items/conf/managed-schema}
		 */
		export interface SearchParams {
			/** @default false */
			advanced?: boolean;
			categories?: Array<Items.Category>;
			"d.status"?: Exclude<Items.Status, "draft">;
			/** Searches on `itemContributor.username`. */
			"d.owner"?: string;
			/** Searches on `source.label`. */
			"d.source"?: string;
			/** Searches on `contributor.name`. */
			"d.contributor"?: string;
			"d.lastInfoUpdate"?: string;
			/** Searches on `externalIdentifier.id`. */
			"d.externalIdentifier"?: string;
			/** Curation flags. */
			"d.curation-flag-coverage"?: BooleanString;
			"d.curation-flag-description"?: BooleanString;
			"d.curation-flag-merged"?: BooleanString;
			"d.curation-flag-relations"?: BooleanString;
			"d.curation-flag-url"?: BooleanString;
			"f.activity"?: Array<string>;
			"f.keyword"?: Array<string>;
			"f.language"?: Array<string>;
			"f.source"?: Array<string>;
			/** @default false */
			includeSteps?: boolean;
			/** @default ["label"] */
			order?: Array<SortOrder>;
			/** @default 1 */
			page?: number;
			/**
			 * Must be lower than or equal to 100.
			 *
			 * @default 25
			 */
			perpage?: number;
			q?: string;
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
		autocomplete(searchParams: Items.Autocomplete.SearchParams) {
			const { category, q } = searchParams;

			const url = createUrl({
				baseUrl,
				pathname: "/api/item-search/autocomplete",
				searchParams: createUrlSearchParams({
					category,
					q,
				}),
			});

			return {
				url,
				request() {
					return request<Items.Autocomplete.Response>(url, { responseType: "json" });
				},
			};
		},
		search(searchParams: Items.Search.SearchParams) {
			const {
				advanced,
				categories,
				"f.activity": activities,
				"f.keyword": keywords,
				"f.language": languages,
				"f.source": sources,
				includeSteps,
				order = ["label"],
				page = 1,
				perpage = 25,
				q,
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
					return request<Items.Search.Response>(url, { responseType: "json" });
				},
			};
		},
	};
}
