import { err, isErr, ok } from "@acdh-oeaw/lib";
import { createEnv, ValidationError } from "@acdh-oeaw/validate-env/runtime";
import * as v from "valibot";

const result = createEnv({
	schema(environment) {
		const Schema = v.object({
			API_BASE_URL: v.pipe(v.string(), v.url()),
		});

		const result = v.safeParse(Schema, environment);

		if (!result.success) {
			return err(new ValidationError(v.summarize(result.issues)));
		}

		return ok(result.output);
	},
	environment: {
		API_BASE_URL: process.env.API_BASE_URL,
	},
	validation: v.parse(
		v.optional(v.picklist(["disabled", "enabled"]), "enabled"),
		process.env.ENV_VALIDATION,
	),
});

if (isErr(result)) {
	throw result.error;
}

export const env = result.value;
