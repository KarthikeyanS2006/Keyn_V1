import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-6 mt-12 transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} Keyn Generator. Powered by Groq & Flux.
        </p>
      </div>
    </footer>
  );
};

export default Footer;