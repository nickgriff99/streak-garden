import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SPECIES,
  PALETTE,
  PLANT_SPECIES,
  PLANT_SPRITES,
  SPECIES_LABELS,
} from './plantSprites';

const STAGES = ['seed', 'sprout', 'sapling', 'bloom', 'flourishing'];
const GRID_SIZE = 12;

describe('plantSprites', () => {
  it('has a transparent entry at palette index 0', () => {
    expect(PALETTE[0]).toBeNull();
  });

  it('defaults to a species that is actually in the species list', () => {
    expect(PLANT_SPECIES).toContain(DEFAULT_SPECIES);
  });

  it('has a label for every species', () => {
    for (const species of PLANT_SPECIES) {
      expect(typeof SPECIES_LABELS[species]).toBe('string');
      expect(SPECIES_LABELS[species].length).toBeGreaterThan(0);
    }
  });

  it('has sprite data for every species listed in PLANT_SPECIES, and no extras', () => {
    expect(Object.keys(PLANT_SPRITES).sort()).toEqual([...PLANT_SPECIES].sort());
  });

  for (const species of PLANT_SPECIES) {
    describe(`${species} sprites`, () => {
      it('has all 5 growth stages, and no extras', () => {
        expect(Object.keys(PLANT_SPRITES[species]).sort()).toEqual([...STAGES].sort());
      });

      for (const stage of STAGES) {
        it(`${stage} grid is a well-formed 12x12 grid of in-range palette indices`, () => {
          const grid = PLANT_SPRITES[species][stage];

          expect(Array.isArray(grid)).toBe(true);
          expect(grid.length).toBe(GRID_SIZE);

          for (const row of grid) {
            expect(Array.isArray(row)).toBe(true);
            expect(row.length).toBe(GRID_SIZE);

            for (const paletteIndex of row) {
              expect(Number.isInteger(paletteIndex)).toBe(true);
              expect(paletteIndex).toBeGreaterThanOrEqual(0);
              expect(paletteIndex).toBeLessThan(PALETTE.length);
            }
          }
        });
      }

      it('grows fuller from seed to flourishing (more painted cells each stage)', () => {
        const paintedCellCount = (grid) =>
          grid.reduce(
            (total, row) => total + row.filter((paletteIndex) => paletteIndex !== 0).length,
            0
          );

        const counts = STAGES.map((stage) => paintedCellCount(PLANT_SPRITES[species][stage]));
        expect(counts[0]).toBeGreaterThan(0);
        for (let i = 1; i < counts.length; i += 1) {
          expect(counts[i]).toBeGreaterThan(counts[i - 1]);
        }
      });
    });
  }
});
