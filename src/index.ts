import rawCountries from 'world-countries';
import type { Country } from 'world-countries';
import { applyCorrections } from './corrections.js';

/**
 * The full `world-countries` dataset with DMUN's maintained corrections applied.
 *
 * This is a **drop-in replacement** for the default export of `world-countries`:
 *
 * ```ts
 * // before
 * import countries from 'world-countries';
 * // after
 * import countries from '@deutschemodelunitednations/world-countries';
 * ```
 *
 * The data itself comes from the `world-countries` **peer dependency** installed
 * in the consuming project, so upstream data updates are picked up automatically
 * (on your next `world-countries` install/update) without a new release of this
 * package. Corrections are layered on top at import time.
 */
const countries: Country[] = applyCorrections(rawCountries);

export default countries;

// Re-export the correction primitives for consumers who want to inspect them.
export { applyCorrections, corrections } from './corrections.js';
export type {
	Correction,
	GuardedCorrection,
	StickyOverride,
	TranslatableField
} from './corrections.js';

// Re-export the upstream types so consumers get them from one place.
export type {
	Country,
	CountryName,
	OfficialAndCommon,
	Currency,
	Demonyms,
	IntlDirectDialingCode
} from 'world-countries';
