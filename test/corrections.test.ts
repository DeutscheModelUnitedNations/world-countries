import { describe, expect, it } from 'vitest';
import rawCountries from 'world-countries';
import corrected, { corrections } from '../src/index.js';

describe('corrections', () => {
	it('exposes the full dataset (same length as upstream)', () => {
		expect(corrected).toHaveLength(rawCountries.length);
	});

	it('does not mutate the upstream array', () => {
		const swzUpstream = rawCountries.find((c) => c.cca3 === 'SWZ');
		// The upstream copy must still read whatever world-countries ships.
		expect(swzUpstream?.translations.deu?.common).not.toBe(undefined);
	});

	describe.each(corrections)(
		'[$cca3] $locale.$field ($kind) — $reason',
		(correction) => {
			const upstreamCountry = rawCountries.find((c) => c.cca3 === correction.cca3);
			const upstreamValue = upstreamCountry?.translations[correction.locale]?.[correction.field];
			const correctedValue = corrected.find((c) => c.cca3 === correction.cca3)?.translations[
				correction.locale
			]?.[correction.field];

			it('targets a country that exists upstream', () => {
				expect(
					upstreamCountry,
					`No country with cca3 "${correction.cca3}" exists in world-countries.`
				).toBeDefined();
			});

			it('targets a translation that exists upstream', () => {
				expect(
					upstreamCountry?.translations[correction.locale],
					`world-countries has no "${correction.locale}" translation for ${correction.cca3}.`
				).toBeDefined();
			});

			if (correction.kind === 'guarded') {
				// SELF-INVALIDATING GUARD: this fails the moment upstream stops
				// shipping the known-wrong value — i.e. once the data is fixed (or
				// otherwise changed) upstream. When it fails, the guarded correction
				// is obsolete: delete it from src/corrections.ts.
				it('is still needed — delete this correction once this test fails', () => {
					expect(
						upstreamValue,
						`world-countries now ships "${upstreamValue}" for ` +
							`${correction.cca3}.${correction.locale}.${correction.field}, not the ` +
							`known-wrong "${correction.whenUpstreamIs}". The guarded correction ` +
							`"${correction.whenUpstreamIs}" -> "${correction.replaceWith}" is obsolete — ` +
							`remove it from src/corrections.ts.`
					).toBe(correction.whenUpstreamIs);
				});

				it('yields the corrected value while active, else passes upstream through', () => {
					const expected =
						upstreamValue === correction.whenUpstreamIs ? correction.replaceWith : upstreamValue;
					expect(correctedValue).toBe(expected);
				});
			} else {
				it('always yields the sticky value, regardless of upstream', () => {
					expect(correctedValue).toBe(correction.value);
				});
			}
		}
	);

	it('Eswatini resolves to its current German name', () => {
		const swz = corrected.find((c) => c.cca3 === 'SWZ');
		expect(swz?.translations.deu?.common).toBe('Eswatini');
	});
});
