import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryActionsContext } from "@/context/InventoryContext";
import Image from "next/image";
import { memo, use } from "react";
import { PrimePart } from "./PrimePart";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

// `counts` holds the owned count of each component, in the same order as
// `primeSet.components`; comparing it element-wise lets unaffected cards skip renders.
const arePropsEqual = (prev, next) =>
  prev.primeSet === next.primeSet &&
  prev.isMastered === next.isMastered &&
  prev.counts.length === next.counts.length &&
  prev.counts.every((count, i) => count === next.counts[i]);

export const PrimeSet = memo(function PrimeSet({ primeSet, counts, isMastered }) {
  const { toggleMastery, build, sell } = use(InventoryActionsContext);

  const isBuildable = primeSet.components.every((part, i) => counts[i] >= part.required);

  const totalRequired = primeSet.components.reduce((sum, part) => sum + part.required, 0);
  const totalOwned = primeSet.components.reduce(
    (sum, part, i) => sum + Math.min(counts[i], part.required),
    0
  );
  const progressPercentage = totalRequired > 0 ? (totalOwned / totalRequired) * 100 : 0;

  return (
    <Card className='border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden dark:border-gray-800 dark:bg-gray-900'>
      <div
        className='absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-300 ease-in-out'
        style={{ width: `${progressPercentage}%` }}
      />
      <CardHeader className='border-b border-gray-100 !pb-0 dark:border-gray-800'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-gray-100 rounded dark:bg-gray-800'>
              {primeSet.imageName && (
                <Image
                  src={`${IMAGE_BASE_URL}${primeSet.imageName}`}
                  alt={primeSet.name}
                  width={80}
                  height={80}
                  className='object-contain'
                />
              )}
            </div>
            <div>
              <CardTitle className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {primeSet.name}
              </CardTitle>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {primeSet.category}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Badge
              variant={
                isBuildable
                  ? isMastered
                    ? "default"
                    : "secondary"
                  : "outline"
              }
              className={
                !isBuildable
                  ? "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600"
                  : isMastered
                  ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
                  : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
              }
            >
              {!isBuildable
                ? "Incomplete"
                : isMastered
                ? "Mastered"
                : "Ready"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={"flex flex-col justify-between h-full"}>
        {/* Set components */}
        <div className='space-y-1 mb-4'>
          {primeSet.components.map((part, i) => (
            <PrimePart
              key={part.uniqueName}
              part={part}
              count={counts[i]}
              setName={primeSet.name}
            />
          ))}
        </div>

        {/* Set actions */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800'>
          <Button
            onClick={() => toggleMastery(primeSet)}
            variant='ghost'
            size='sm'
            className={`text-xs ${
              isMastered
                ? "text-amber-800 bg-amber-50 hover:bg-amber-600 hover:text-white dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-600"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {isMastered ? "✓ Mastered" : "Mark as Mastered"}
          </Button>

          <div className='flex space-x-2'>
            <Button
              onClick={() => build(primeSet)}
              disabled={!isBuildable}
              size='sm'
              className='bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 dark:bg-amber-600 dark:hover:bg-amber-700'
            >
              Build
            </Button>
            <Button
              onClick={() => sell(primeSet)}
              disabled={!isBuildable}
              variant='outline'
              size='sm'
              className='border-gray-300 disabled:border-gray-200 disabled:text-gray-400 dark:border-gray-600 dark:disabled:border-gray-700 dark:disabled:text-gray-500'
            >
              Sell
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
