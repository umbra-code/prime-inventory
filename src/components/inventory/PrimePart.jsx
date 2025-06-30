import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { InventoryContext } from "@/context/InventoryContext";
import { use } from "react";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export function PrimePart({ part }) {
  const { handleUpdatePart } = use(InventoryContext);

  const getPartStatus = () => {
    if (part.userCount === 0) return "missing";
    if (part.userCount < part.required) return "partial";
    return "complete";
  };

  return (
    <div className='flex items-center justify-between py-2 px-3 border-l-4 border-l-gray-200 hover:border-l-amber-500 hover:bg-gray-50 transition-colors dark:border-l-gray-700 dark:hover:bg-gray-800'>
      <div className='flex items-center space-x-3'>
        <div className='p-px bg-gray-100/50 rounded dark:bg-gray-800/50'>
          {part.imageName && (
            <Image
              src={`${IMAGE_BASE_URL}${part.imageName}`}
              alt={part.name}
              width={32} // Corresponds to w-8 (32px)
              height={32} // Corresponds to h-8 (32px)
              className='' // Remove object-contain, keep original size
            />
          )}
        </div>
        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>{part.name}</span>
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            handleUpdatePart(part.uniqueName, Math.max(0, part.userCount - 1))
          }
          className='h-7 w-7 p-0 border-gray-300 dark:border-gray-600'
        >
          <Minus className='h-3 w-3' />
        </Button>

        <div className='flex items-center space-x-1 min-w-[60px] justify-center'>
          <Input
            type='number'
            value={part.userCount}
            onChange={(e) =>
              handleUpdatePart(
                part.uniqueName,
                Number.parseInt(e.target.value) || 0
              )
            }
            className='w-10 h-7 text-center text-xs border-gray-300 dark:bg-gray-900 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            min='0'
          />
          <span className='text-xs text-gray-500 dark:text-gray-400'>/{part.required}</span>
        </div>

        <Button
          size='sm'
          variant='outline'
          onClick={() => handleUpdatePart(part.uniqueName, part.userCount + 1)}
          className='h-7 w-7 p-0 border-gray-300 dark:border-gray-600'
        >
          <Plus className='h-3 w-3' />
        </Button>

        <div
          className={`w-2 h-2 rounded-full ml-2 ${
            getPartStatus() === "missing"
              ? "bg-red-500"
              : getPartStatus() === "partial"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        />
      </div>
    </div>
  );
}