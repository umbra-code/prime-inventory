import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { summarizeSet } from "@/services/userInventory";
import Image from "next/image";
import { memo, use } from "react";
import { PrimePart } from "./PrimePart";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

const STATUS_STYLES = {
  incomplete: {
    accent: "var(--set-incomplete)",
    bar: "bg-amber-500",
    badge: "Incomplete",
    badgeClass: "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600",
  },
  ready: {
    accent: "var(--set-ready)",
    bar: "bg-green-500",
    badge: "Ready to Build",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
  },
  extra: {
    accent: "var(--set-extra)",
    bar: "bg-violet-500",
    badge: "Extra Set",
    badgeClass:
      "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-800",
  },
};

const PRIMARY_BUILD =
  "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-white";
const PRIMARY_SELL =
  "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-700 dark:text-white";
const SECONDARY =
  "border-gray-300 disabled:border-gray-200 disabled:text-gray-400 dark:border-gray-600 dark:disabled:border-gray-700 dark:disabled:text-gray-500";

const progressLabel = ({ status, progress, missing }) => {
  if (status === "ready") return "All parts collected";
  if (status === "extra") return "Ready to sell";
  return `${Math.floor(progress)}% · ${missing} ${missing === 1 ? "part" : "parts"} missing`;
};

// Complete sets get the full accent; incomplete ones fade in quadratically so
// only the sets close to completion stand out.
const accentStyle = ({ status, progress }) => {
  const { accent } = STATUS_STYLES[status];
  const strength = status === "incomplete" ? (progress / 100) ** 2 * 0.7 : 1;
  const ring = status === "incomplete" ? "0 0 0 0 transparent" : `0 0 0 1px ${accent}`;
  return {
    borderColor: `color-mix(in oklab, ${accent} ${Math.round(strength * 100)}%, var(--set-border))`,
    boxShadow: `${ring}, 0 0 ${Math.round(28 * strength)}px -6px color-mix(in oklab, ${accent} ${Math.round(strength * 60)}%, transparent)`,
  };
};

// `counts` holds the owned count of each component, in the same order as
// `primeSet.components`; comparing it element-wise lets unaffected cards skip renders.
const arePropsEqual = (prev, next) =>
  prev.primeSet === next.primeSet &&
  prev.isMastered === next.isMastered &&
  prev.counts.length === next.counts.length &&
  prev.counts.every((count, i) => count === next.counts[i]);

export const PrimeSet = memo(function PrimeSet({ primeSet, counts, isMastered }) {
  const { toggleMastery, build, sell } = use(InventoryActionsContext);

  const summary = summarizeSet(primeSet, counts, isMastered);
  const { status, progress } = summary;
  const styles = STATUS_STYLES[status];
  const isComplete = status !== "incomplete";

  return (
    <Card
      className='border relative overflow-hidden transition-[border-color,box-shadow] duration-300 dark:bg-gray-900'
      style={accentStyle(summary)}
    >
      <div
        className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ease-in-out ${styles.bar}`}
        style={{ width: `${progress}%` }}
      />
      <CardHeader className='border-b border-gray-100 !pb-0 dark:border-gray-800'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center space-x-3 min-w-0'>
            <div className='p-1.5 sm:p-2 bg-gray-100 rounded dark:bg-gray-800 shrink-0'>
              {primeSet.imageName && (
                <Image
                  src={`${IMAGE_BASE_URL}${primeSet.imageName}`}
                  alt={primeSet.name}
                  width={80}
                  height={80}
                  className='object-contain size-14 sm:size-20'
                />
              )}
            </div>
            <div className='min-w-0'>
              <CardTitle className='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {primeSet.name}
              </CardTitle>
              <p className='text-sm text-gray-500 dark:text-gray-400'>{primeSet.category}</p>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5'>
                {progressLabel(summary)}
              </p>
            </div>
          </div>

          <Badge variant='outline' className={`shrink-0 ${styles.badgeClass}`}>
            {styles.badge}
          </Badge>
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

        {/* Set actions: the primary action follows the set status */}
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
              disabled={!isComplete}
              variant={status === "ready" ? "default" : "outline"}
              size='sm'
              className={status === "ready" ? PRIMARY_BUILD : SECONDARY}
            >
              Build
            </Button>
            <Button
              onClick={() => sell(primeSet)}
              disabled={!isComplete}
              variant={status === "extra" ? "default" : "outline"}
              size='sm'
              className={status === "extra" ? PRIMARY_SELL : SECONDARY}
            >
              Sell
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
