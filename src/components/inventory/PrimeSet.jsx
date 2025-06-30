import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InventoryContext } from "@/context/InventoryContext";
import { Minus, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import { use } from "react";
import { PrimePart } from "./PrimePart";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export function PrimeSet({ primeSet }) {
  const {
    handleUpdatePart: onUpdatePart,
    handleToggleMastery: onToggleMastery,
    handleBuild: onBuild,
    handleSell: onSell,
  } = use(InventoryContext);

  const isBuildable =
    primeSet.components?.every((part) => part.userCount >= part.required) ??
    primeSet.userCount >= primeSet.required;

  const progressPercentage = (() => {
    if (primeSet.components && primeSet.components.length > 0) {
      const totalEffectiveObtained = primeSet.components.reduce(
        (sum, part) => sum + Math.min(part.userCount || 0, part.required || 1),
        0
      );
      const totalRequired = primeSet.components.reduce(
        (sum, part) => sum + (part.required || 1),
        0
      );
      return totalRequired > 0
        ? Math.min(100, (totalEffectiveObtained / totalRequired) * 100)
        : 0;
    } else {
      // For direct items (no components)
      const userCount = primeSet.userCount || 0;
      const required = primeSet.required || 1;
      return required > 0 ? Math.min(100, (userCount / required) * 100) : 0;
    }
  })();

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
                  width={80} // Corresponds to size-20 (80px)
                  height={80} // Corresponds to size-20 (80px)
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
                  ? primeSet.isMastered
                    ? "default"
                    : "secondary"
                  : "outline"
              }
              className={
                !isBuildable
                  ? "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600"
                  : primeSet.isMastered
                  ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
                  : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
              }
            >
              {!isBuildable
                ? "Incomplete"
                : primeSet.isMastered
                ? "Mastered"
                : "Ready"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={"flex flex-col justify-between h-full"}>
        {/* Partes del set */}
        {primeSet.components && primeSet.components.length > 0 ? (
          <div className='space-y-1 mb-4'>
            {primeSet.components.map((part, index) => (
              <PrimePart
                key={`${part.uniqueName}-${index}`}
                part={part}
                onUpdateCount={onUpdatePart}
              />
            ))}
          </div>
        ) : (
          // Para mods Prime sin componentes
          <div className='flex items-center justify-between py-2 px-3 bg-blue-50 border border-blue-200 rounded mb-4 dark:bg-blue-900/50 dark:border-blue-800'>
            <div className='flex items-center space-x-3'>
              <Sparkles className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <span className='text-sm font-medium text-blue-900 dark:text-blue-200'>
                Direct Item
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onUpdatePart(
                    primeSet.name,
                    Math.max(0, (primeSet.userCount || 0) - 1)
                  )
                }
                className='h-7 w-7 p-0 dark:border-gray-600'
              >
                <Minus className='h-3 w-3' />
              </Button>
              <Input
                type='number'
                value={primeSet.userCount || 0}
                onChange={(e) =>
                  onUpdatePart(
                    primeSet.name,
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className='w-12 h-7 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-gray-900 dark:border-gray-600'
                min='0'
              />
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onUpdatePart(primeSet.name, (primeSet.userCount || 0) + 1)
                }
                className='h-7 w-7 p-0 dark:border-gray-600'
              >
                <Plus className='h-3 w-3' />
              </Button>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800'>
          <Button
            onClick={() => onToggleMastery(primeSet.name)}
            variant='ghost'
            size='sm'
            className={`text-xs ${
              primeSet.isMastered
                ? "text-amber-800 bg-amber-50 hover:bg-amber-600 hover:text-white dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-600"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {primeSet.isMastered ? "✓ Mastered" : "Mark as Mastered"}
          </Button>

          <div className='flex space-x-2'>
            <Button
              onClick={() => onBuild(primeSet)}
              disabled={!isBuildable}
              size='sm'
              className='bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 dark:bg-amber-600 dark:hover:bg-amber-700'
            >
              Build
            </Button>
            <Button
              onClick={() => onSell(primeSet)}
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
}
