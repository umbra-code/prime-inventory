
export function Footer() {
  return (
    <footer className='bg-gray-800/50 border-t border-gray-700 mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='text-center text-sm text-gray-400'>
          © {new Date().getFullYear()} Prime Inventory. Warframe content and
          materials are trademarks of Digital Extremes Ltd.
        </div>
      </div>
    </footer>
  );
}
