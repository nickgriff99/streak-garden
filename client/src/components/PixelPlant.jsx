import {
  DEFAULT_SPECIES,
  PALETTE,
  PLANT_SPRITES,
  SPECIES_LABELS,
} from '../pixelart/plantSprites';

const DEFAULT_STAGE = 'seed';
const GRID_SIZE = 12;

export function PixelPlant({ species, stage, size = 48, className = '' }) {
  const bySpecies = PLANT_SPRITES[species] || PLANT_SPRITES[DEFAULT_SPECIES];
  const grid = bySpecies[stage] || bySpecies[DEFAULT_STAGE];

  const resolvedSpecies = PLANT_SPRITES[species] ? species : DEFAULT_SPECIES;
  const resolvedStage = bySpecies[stage] ? stage : DEFAULT_STAGE;
  const label = SPECIES_LABELS[resolvedSpecies] || resolvedSpecies;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${label} plant, ${resolvedStage} stage`}
    >
      {grid.map((row, rowIndex) =>
        row.map((paletteIndex, colIndex) => {
          if (paletteIndex === 0) return null;
          const color = PALETTE[paletteIndex];
          return (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex}
              y={rowIndex}
              width={1}
              height={1}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}
