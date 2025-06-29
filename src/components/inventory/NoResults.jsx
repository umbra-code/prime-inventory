
import { Package } from "lucide-react";

export function NoResults() {
  return (
    <div className='text-center py-12'>
      <Package className='h-12 w-12 text-gray-500 mx-auto mb-4' />
      <h3 className='text-lg font-medium text-white mb-2'>
        No Prime sets found
      </h3>
      <p className='text-gray-400'>
        Try adjusting your search filters to find what you're looking for.
      </p>
    </div>
  );
}
