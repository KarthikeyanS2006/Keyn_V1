import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Key, Eye, EyeOff, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('keyn_groq_key');
      if (storedKey) setApiKey(storedKey);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSaveKey = () => {
    localStorage.setItem('keyn_groq_key', apiKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* API Configuration */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium text-sm uppercase tracking-wider">
                <Key className="w-4 h-4" />
                <h3>API Configuration</h3>
             </div>
             
             <div className="space-y-2">
               <label htmlFor="apiKey" className="text-xs text-zinc-500 dark:text-zinc-400">
                 Groq API Key (starts with gsk_)
               </label>
               <div className="relative">
                 <input
                   id="apiKey"
                   type={showKey ? "text" : "password"}
                   value={apiKey}
                   onChange={(e) => {
                     setApiKey(e.target.value);
                     setIsSaved(false);
                   }}
                   placeholder="gsk_..."
                   className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pr-24 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                 />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <button 
                     onClick={() => setShowKey(!showKey)}
                     className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                   >
                     {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                   <button
                     onClick={handleSaveKey}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSaved 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                     }`}
                   >
                     {isSaved ? 'Saved' : 'Save'}
                   </button>
                 </div>
               </div>
               <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                 Your key is stored locally in your browser and used for prompt enhancement.
               </p>
             </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Appearance
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  theme === 'system'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
             <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
               Keyn v1.0.0
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;