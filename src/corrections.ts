import type { Country } from 'world-countries';

/**
 * The two string fields of a translation entry we may correct.
 * (`world-countries` exposes `translations[lang] = { common, official }`.)
 */
export type TranslatableField = 'common' | 'official';

interface BaseCorrection {
	/** ISO 3166-1 alpha-3 code of the affected country, e.g. `"SWZ"`. */
	cca3: string;
	/** Translation language key in `world-countries`, e.g. `"deu"`. */
	locale: string;
	/** Which field of the translation to touch. */
	field: TranslatableField;
	/** Why this correction exists — shown in test failures and read by humans. */
	reason: string;
}

/**
 * A correction that **only applies while upstream still ships a specific wrong
 * value**. The moment `world-countries` changes that field — whether to the
 * fix or to anything else — the guard stops matching and the upstream value is
 * passed through untouched. This lets the correction self-deactivate the
 * instant upstream catches up, with **no new release of this wrapper required**
 * (the data comes from the consumer's own peer-installed `world-countries`).
 *
 * The accompanying test turns red once `whenUpstreamIs` no longer matches,
 * signalling that the entry is dead and can be deleted.
 */
export interface GuardedCorrection extends BaseCorrection {
	kind: 'guarded';
	/** The value upstream currently ships that we consider wrong. */
	whenUpstreamIs: string;
	/** What we substitute while the wrong value persists. */
	replaceWith: string;
}

/**
 * A deliberate, **sticky** override that is applied regardless of what upstream
 * ships. Use this for intentional house-style choices (not upstream bugs) that
 * should survive upstream changes.
 */
export interface StickyOverride extends BaseCorrection {
	kind: 'sticky';
	/** The value we always want, overriding upstream. */
	value: string;
}

export type Correction = GuardedCorrection | StickyOverride;

/**
 * The maintained list of corrections.
 *
 * - Add a `guarded` entry for an upstream data bug you want auto-healed once
 *   upstream fixes it.
 * - Add a `sticky` entry for a deliberate deviation you want to keep.
 */
export const corrections: readonly Correction[] = [
	{
		kind: 'guarded',
		cca3: 'SWZ',
		locale: 'deu',
		field: 'common',
		whenUpstreamIs: 'Swasiland',
		replaceWith: 'Eswatini',
		reason:
			'Swaziland was renamed to Eswatini in 2018. world-countries still ships the former German common name "Swasiland". Remove this entry once upstream publishes the corrected value.'
	}
];

/** Resolve the value a single correction yields for the given upstream value. */
function resolveValue(correction: Correction, upstreamValue: string | undefined): string | undefined {
	if (correction.kind === 'sticky') {
		return correction.value;
	}
	// guarded: only substitute while upstream still holds the known-wrong value
	return upstreamValue === correction.whenUpstreamIs ? correction.replaceWith : upstreamValue;
}

/**
 * Apply all corrections to a copy of the given countries array and return the
 * corrected copy. The input is never mutated.
 */
export function applyCorrections(countries: readonly Country[]): Country[] {
	// Deep-clone each entry (map yields a mutable array; structuredClone yields a
	// mutable Country) so the caller's array is never mutated — no cast needed.
	const corrected: Country[] = countries.map((country) => structuredClone(country));
	const byCca3 = new Map(corrected.map((country) => [country.cca3, country]));

	for (const correction of corrections) {
		const country = byCca3.get(correction.cca3);
		if (!country) continue;

		const translation = country.translations[correction.locale];
		if (!translation) continue;

		const next = resolveValue(correction, translation[correction.field]);
		if (next !== undefined) {
			translation[correction.field] = next;
		}
	}

	return corrected;
}
