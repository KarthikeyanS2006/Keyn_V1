import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 mt-auto transition-colors duration-300">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-zinc-900 dark:text-zinc-100 font-bold text-sm tracking-wide">
          Keyan Groups
        </p>
        <p className="text-zinc-400 dark:text-zinc-600 text-[10px] uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Designed for Mobile & Web
        </p>
      </div>
    </footer>
  );
};

export default Footer;