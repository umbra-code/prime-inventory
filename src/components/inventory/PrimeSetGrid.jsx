
import { PrimeSet } from "./PrimeSet";

export function PrimeSetGrid({
  sets,
  onUpdatePart,
  onToggleMastery,
  onBuild,
  onSell,
}) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {sets.map((primeSet) => (
        <PrimeSet
          key={primeSet.name}
          primeSet={primeSet}
          onUpdatePart={onUpdatePart}
          onToggleMastery={onToggleMastery}
          onBuild={onBuild}
          onSell={onSell}
        />
      ))}
    </div>
  );
}
