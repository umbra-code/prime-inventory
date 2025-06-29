import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { PrimePart } from "./PrimePart";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export function PrimeSet({
  primeSet,
  onUpdatePart,
  onToggleMastery,
  onBuild,
  onSell,
}) {
  const isBuildable =
    primeSet.parts?.every((part) => part.userCount >= part.required) ??
    primeSet.userCount >= primeSet.required;

  const getSetColor = () => {
    if (!isBuildable) return "bg-gray-800/40 border-gray-700/50";
    if (isBuildable && !primeSet.isMastered)
      return "bg-green-900/20 border-green-700/50";
    if (isBuildable && primeSet.isMastered)
      return "bg-amber-900/20 border-amber-600/50";
    return "bg-gray-800/40 border-gray-700/50";
  };

  const getSetStatus = () => {
    if (!isBuildable) return "Incomplete";
    if (isBuildable && !primeSet.isMastered) return "Ready to Build";
    if (isBuildable && primeSet.isMastered) return "Extra Set";
    return "Unknown";
  };

  const getStatusBadgeColor = () => {
    if (getSetStatus() === "Ready to Build")
      return "bg-green-600 hover:bg-green-700";
    if (getSetStatus() === "Extra Set")
      return "bg-amber-600 hover:bg-amber-700";
    return "bg-gray-600 hover:bg-gray-700";
  };

  return (
    <Card
      className={`${getSetColor()} transition-all duration-200 backdrop-blur-sm`}
    >
      <CardHeader>
        <div className='flex items-center space-x-4 mb-3'>
          <img
            src={`${IMAGE_BASE_URL}${primeSet.imageName}`}
            alt={primeSet.name}
            className='size-20 object-contain bg-black/20 rounded-lg shadow-sm p-1'
          />
          <div>
            <CardTitle className='text-lg font-bold text-white'>
              {primeSet.name}
            </CardTitle>
            <div className='flex items-center space-x-2 mt-1'>
              <Badge
                variant='secondary'
                className='text-xs bg-gray-700 text-gray-300'
              >
                {primeSet.category}
              </Badge>
              <Badge className={`text-xs text-white ${getStatusBadgeColor()}`}>
                {getSetStatus()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botón Mastered Toggle */}
        <Button
          onClick={() => onToggleMastery(primeSet.name)}
          variant='outline'
          size='sm'
          className={`w-fit transition-all duration-200 cursor-pointer ${
            primeSet.isMastered
              ? "bg-amber-600/20 border-amber-500 text-amber-400 hover:bg-amber-600/30"
              : "bg-gray-800/30 border-gray-700 text-gray-400 hover:bg-amber-500/75 hover:text-white"
          }`}
        >
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                primeSet.isMastered ? "bg-amber-400" : "bg-gray-500"
              }`}
            />
            <span className='text-sm font-medium'>
              {primeSet.isMastered ? "Mastered" : "Not Mastered"}
            </span>
          </div>
        </Button>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Partes del set */}
        {primeSet.components && primeSet.components.length > 0 ? (
          <div className='space-y-2'>
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
          <div className='flex items-center justify-between p-3 rounded-lg border-2 bg-sky-950/30 border-sky-800/50 backdrop-blur-sm'>
            <span className='font-medium text-sky-400'>Direct Item</span>
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
                className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
              >
                <Minus className='h-4 w-4' />
              </Button>

              <div className='flex items-center space-x-1'>
                <Input
                  type='number'
                  value={primeSet.userCount || 0}
                  onChange={(e) =>
                    onUpdatePart(
                      primeSet.name,
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className='w-16 h-8 text-center bg-gray-800/50 border-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                  min='0'
                />
                <span className='text-sm font-medium text-gray-400'>
                  /{primeSet.required || 1}
                </span>
              </div>

              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onUpdatePart(primeSet.name, (primeSet.userCount || 0) + 1)
                }
                className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className='flex space-x-2 pt-2'>
          <Button
            onClick={() => onBuild(primeSet)}
            disabled={!isBuildable}
            className='flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-700 disabled:text-gray-400'
            size='sm'
          >
            Build
          </Button>
          <Button
            onClick={() => onSell(primeSet)}
            disabled={!isBuildable}
            variant='outline'
            className='flex-1 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700'
            size='sm'
          >
            Sell
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
