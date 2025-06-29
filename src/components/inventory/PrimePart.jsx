import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export function PrimePart({ part, onUpdateCount }) {
  const getPartColor = () => {
    if (part.userCount === 0)
      return "text-red-400 bg-red-950/30 border-red-800/50";
    if (part.userCount < part.required)
      return "text-amber-400 bg-amber-950/30 border-amber-800/50";
    return "text-green-400 bg-green-950/30 border-green-800/50";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border-2 ${getPartColor()} backdrop-blur-sm gap-3`}
    >
      <div className='flex items-center space-x-2'>
        {part.imageName && (
          <Image
            src={`${IMAGE_BASE_URL}${part.imageName}`}
            alt={part.name}
            width={32} // Corresponds to w-8 (32px)
            height={32} // Corresponds to h-8 (32px)
            className='object-contain'
          />
        )}
        <span className='font-medium'>{part.name}</span>
      </div>
      <div className='flex items-center space-x-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            onUpdateCount(part.uniqueName, Math.max(0, part.userCount - 1))
          }
          className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
        >
          <Minus className='h-4 w-4' />
        </Button>

        <div className='flex items-center space-x-1'>
          <Input
            type='number'
            value={part.userCount}
            onChange={(e) =>
              onUpdateCount(
                part.uniqueName,
                Number.parseInt(e.target.value) || 0
              )
            }
            className='w-14 h-8 text-center bg-gray-800/50 border-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            min='0'
          />
          <span className='text-sm font-medium text-gray-400'>
            /{part.required}
          </span>
        </div>

        <Button
          size='sm'
          variant='outline'
          onClick={() => onUpdateCount(part.uniqueName, part.userCount + 1)}
          className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
        >
          <Plus className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
