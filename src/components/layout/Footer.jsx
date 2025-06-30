"use client";

export function Footer() {
  return (
    <footer className='bg-white border-t border-gray-200 mt-16 dark:bg-gray-900 dark:border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
          © {new Date().getFullYear()} Prime Inventory. Warframe content and
          materials are trademarks of Digital Extremes Ltd.
        </div>
      </div>
    </footer>
  );
}