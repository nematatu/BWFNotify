export type JsonObject = Record<string, unknown>;

export function object(value: unknown): JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as JsonObject)
		: {};
}

export function arrayOf<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

export function looksJson(value: string): boolean {
	return /^[\s]*[{[]/.test(value);
}

export function preview(value: string): string {
	return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

export function positiveInt(value: string | undefined, name = "value"): number {
	const parsed = Number.parseInt(value || "", 10);
	if (Number.isFinite(parsed) && parsed > 0) {
		return parsed;
	}

	throw new Error(`${name} must be a positive integer`);
}

export function csv(value: string): string[] {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function todayJst(): string {
	return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
