import React, { useState, useCallback, useEffect } from 'react';
import { Download, Loader2, Image as ImageIcon, SendHorizontal, AlertCircle, Wand2, Sparkles, Clock, Trash2, Share2, Check, Copy, AlertTriangle, Palette, X, RefreshCw } from 'lucide-react';
import { generateImageContent, enhancePrompt } from '../services/geminiService';
import { AspectRatio, HistoryItem, ImageStyle } from '../types';

// Reusable Tooltip Component (Hidden on mobile to prevent touch issues)
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden sm:group-hover:block px-3 py-1.5 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none transform transition-all duration-200 animate-in fade-in slide-in-from-bottom-1">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-100"></div>
      </div>
    </div>
  );
};

const SAMPLE_PROMPTS = [
  "A cyberpunk street food vendor in neon rain, cinematic lighting",
  "A serene Japanese garden with cherry blossoms at night, lantern light",
  "Cute isometric 3D forest spirit, soft pastel colors, minimal",
  "Astronaut meditating on a floating rock in deep space, nebula"
];

const STYLES: ImageStyle[] = [
  'None',
  'Cinematic',
  'Photorealistic',
  'Anime',
  'Fantasy',
  '3D Render',
  'Cyberpunk',
  'Abstract',
  'Oil Painting',
  'Minimalist'
];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('None');
  const [isPromptEnhanced, setIsPromptEnhanced] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('keyn_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('keyn_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your history?')) {
      saveHistory([]);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsPromptEnhanced(false);
    if (error) setError(null);
    if (warning) setWarning(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setIsPromptEnhanced(false);
    if (error) setError(null);
    if (warning) setWarning(null);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setEnhancing(true);
    setError(null);
    setWarning(null);
    
    try {
      const newPrompt = await enhancePrompt(prompt, selectedStyle);
      setPrompt(newPrompt);
      setIsPromptEnhanced(true);
    } catch (err: any) {
      let errorMessage = "Failed to enhance prompt.";
      if (err.code === 'API_KEY_MISSING') {
          errorMessage = "Groq API Key is missing. Please add it in Settings.";
      } else if (err.code === 'AUTH_ERROR') {
          errorMessage = "Invalid API Key. Please check the key in Settings.";
      } else if (err.code === 'RATE_LIMIT') {
          errorMessage = "Too many requests. Please wait a moment.";
      } else if (err.code === 'NETWORK_ERROR') {
          errorMessage = "No internet connection. Please check your network.";
      }
      setError(errorMessage);
    } finally {
      setEnhancing(false);
    }
  };

  const generate = async (currentPrompt: string) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setGeneratedImage(null);
    
    if (!isPromptEnhanced) {
        setEnhancedPrompt(null); 
    }

    try {
      const result = await generateImageContent(currentPrompt, aspectRatio, isPromptEnhanced, selectedStyle);
      
      if (result.warning) {
        setWarning(result.warning);
      }

      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);

        const finalPrompt = result.textResponse || currentPrompt;

        if (!isPromptEnhanced) {
            setEnhancedPrompt(finalPrompt);
        }

        if (result.originalUrl) {
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            url: result.originalUrl,
            prompt: currentPrompt,
            enhancedPrompt: result.textResponse,
            aspectRatio: aspectRatio,
            style: selectedStyle,
            timestamp: Date.now()
          };
          const updatedHistory = [newItem, ...history].slice(0, 20);
          saveHistory(updatedHistory);
        }

      } else {
        setError("The model processed your request but did not return an image.");
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Generation failed. Please try again.";
      
      if (err.code === 'NETWORK_ERROR') {
          errorMessage = "You appear to be offline. Please check your connection.";
      } else if (err.code === 'IMAGE_SERVICE_ERROR') {
          errorMessage = "Image service unavailable. Please try again later.";
      } else if (err.code === 'CONTENT_FILTER') {
          errorMessage = "Could not generate image. Try a different description.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await generate(prompt);
  };

  const handleRetry = async () => {
    if (!prompt.trim()) return;
    await generate(prompt);
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setGeneratedImage(item.url);
    setPrompt(item.prompt);
    setEnhancedPrompt(item.enhancedPrompt);
    setAspectRatio(item.aspectRatio);
    setSelectedStyle(item.style || 'None');
    setIsPromptEnhanced(!!item.enhancedPrompt);
    setError(null);
    setWarning(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;

    try {
      let downloadUrl = generatedImage;
      if (!generatedImage.startsWith('blob:') && !generatedImage.startsWith('data:')) {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `keyn-gen-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (downloadUrl !== generatedImage && !generatedImage.startsWith('data:')) {
        URL.revokeObjectURL(downloadUrl);
      }

    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to download image. Try opening it in a new tab.");
    }
  }, [generatedImage]);

  const handleShare = async () => {
    if (!generatedImage) return;

    if (navigator.share) {
      try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], 'keyn-generated.jpg', { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
                title: 'Keyn AI Image',
                text: `Check out this image I generated with Keyn!\n\nPrompt: "${prompt}"`,
                files: [file]
             });
        } else {
            await navigator.share({
                title: 'Keyn AI Image',
                text: `Check out this image I generated with Keyn!\n\nPrompt: "${prompt}"`
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }

      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
             console.error('Error sharing:', error);
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
        }
      }
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEnhancedPrompt = async () => {
    if (!enhancedPrompt) return;
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy prompt', e);
    }
  };

  const handleDownloadEnhancedPrompt = () => {
    if (!enhancedPrompt) return;
    const element = document.createElement("a");
    const file = new Blob([enhancedPrompt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `keyn-prompt-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getRatioTooltip = (ratio: AspectRatio) => {
    switch (ratio) {
      case AspectRatio.SQUARE: return 'Square (1:1)';
      case AspectRatio.PORTRAIT: return 'Portrait (9:16)';
      case AspectRatio.LANDSCAPE: return 'Landscape (16:9)';
      case AspectRatio.WIDE: return 'Wide (4:3)';
      case AspectRatio.TALL: return 'Tall (3:4)';
      default: return ratio;
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Input Section */}
      <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm transition-colors duration-300">
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-3">
            
            {/* Header: Label + Style Selector */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">
                  Describe your imagination
                </label>
                {isPromptEnhanced && (
                   <span className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 animate-in fade-in">
                      <Sparkles className="w-3 h-3" /> Enhanced
                   </span>
                )}
              </div>

              {/* Mobile optimized scrollable style selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 px-1 flex-shrink-0">
                  <Palette className="w-3 h-3" /> Style:
                </span>
                {STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 border active:scale-95 touch-manipulation ${
                      selectedStyle === style
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="relative group">
              <textarea
                id="prompt"
                value={prompt}
                onChange={handlePromptChange}
                placeholder="A futuristic cyberpunk city with neon lights reflecting in rain puddles..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 pr-12 text-base text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 min-h-[120px] resize-none transition-all scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                disabled={loading}
              />
              
              <div className="absolute bottom-3 right-3 text-xs text-zinc-500 dark:text-zinc-600">
                {prompt.length}/1000
              </div>

              <div className="absolute top-3 right-3">
                 <Tooltip text="Upgrade prompt with AI">
                    <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        disabled={loading || enhancing || !prompt.trim()}
                        className={`p-2 rounded-lg transition-all border active:scale-95 touch-manipulation ${
                            enhancing 
                            ? 'bg-orange-500/10 border-orange-200 text-orange-500 animate-pulse cursor-wait'
                            : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/50 text-zinc-400 hover:text-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-orange-500/30'
                        }`}
                    >
                        {enhancing ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                             <Wand2 className="w-4 h-4" />
                        )}
                    </button>
                 </Tooltip>
              </div>
            </div>

            {/* Prompt Suggestions - Horizontal Scroll on mobile */}
            <div className="flex gap-2 mt-1 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
               {SAMPLE_PROMPTS.map((s, i) => (
                 <button
                   key={i}
                   type="button"
                   onClick={() => handleSuggestionClick(s)}
                   className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/50 hover:border-orange-500/30 text-zinc-600 dark:text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-1.5 rounded-full transition-all active:scale-95 touch-manipulation whitespace-nowrap sm:whitespace-normal"
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-sm text-zinc-500 font-medium">Aspect Ratio:</span>
              <div className="flex bg-zinc-50 dark:bg-zinc-950 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {Object.values(AspectRatio).map((ratio) => (
                  <Tooltip key={ratio} text={getRatioTooltip(ratio)}>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-1 sm:flex-none text-center active:scale-95 touch-manipulation ${
                        aspectRatio === ratio
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {ratio}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className={`w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base transition-all shadow-lg shadow-orange-900/20 active:scale-95 touch-manipulation ${
                loading || !prompt.trim()
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:opacity-90'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Section */}
      <div className="min-h-[300px] sm:min-h-[400px] flex flex-col">
        
        {/* Alerts Area */}
        <div className="space-y-4 mb-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 relative">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-grow pr-6">
                    <p className="text-sm font-medium">{error}</p>
                    <button 
                        onClick={handleRetry}
                        className="mt-2 text-xs font-bold underline decoration-red-400/50 hover:decoration-red-400 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Retry Generation
                    </button>
                </div>
                <button 
                    onClick={() => setError(null)}
                    className="absolute top-3 right-3 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Warning Alert */}
            {warning && !error && (
              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 text-yellow-700 dark:text-yellow-400 animate-in fade-in slide-in-from-top-2 relative">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-grow pr-6">
                    <p className="text-sm font-medium">{warning}</p>
                </div>
                <button 
                    onClick={() => setWarning(null)}
                    className="absolute top-3 right-3 p-1 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>
            )}
        </div>

        {enhancedPrompt && (
          <div className="mb-4 p-4 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500 relative group/prompt transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                    <Wand2 className="w-3 h-3" />
                    <span>AI Enhanced Prompt</span>
                </div>
                <div className="flex items-center gap-1 opacity-100 transition-opacity">
                    <Tooltip text="Copy prompt">
                        <button 
                            onClick={handleCopyEnhancedPrompt}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
                        >
                            {promptCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </Tooltip>
                    <Tooltip text="Download prompt as text">
                        <button 
                            onClick={handleDownloadEnhancedPrompt}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm italic pr-0">"{enhancedPrompt}"</p>
          </div>
        )}

        <div className={`relative flex-grow bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-500 min-h-[300px] ${generatedImage ? 'border-none bg-transparent' : ''}`}>
          
          {!generatedImage && !loading && (
            <div className="text-center p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium mb-1 text-sm sm:text-base">No image generated yet</h3>
              <p className="text-zinc-500 dark:text-zinc-600 text-xs sm:text-sm max-w-xs mx-auto">
                Enter a descriptive prompt above and hit generate.
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-20">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-zinc-200 dark:border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparkleIcon />
                </div>
              </div>
              <p className="mt-4 text-orange-600 dark:text-orange-400 font-medium animate-pulse text-sm">Creating masterpiece...</p>
            </div>
          )}

          {generatedImage && (
            <div className="relative group w-full h-full flex items-center justify-center">
               <img
                src={generatedImage}
                alt={prompt}
                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
                onLoad={() => setLoading(false)}
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                <Tooltip text="Share">
                  <button
                    onClick={handleShare}
                    className="bg-white/90 backdrop-blur text-zinc-950 hover:bg-zinc-100 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg transform transition-transform active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
                  </button>
                </Tooltip>
                
                <Tooltip text="Download">
                  <button
                    onClick={handleDownload}
                    className="bg-white/90 backdrop-blur text-zinc-950 hover:bg-zinc-100 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg transform transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-4 sm:mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-300 flex items-center gap-2">
               <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
               Recent Creations
             </h2>
             <button 
               onClick={clearHistory}
               className="text-xs text-red-500 hover:text-red-600 dark:text-red-500/70 dark:hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
             >
               <Trash2 className="w-3 h-3" /> Clear History
             </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => restoreFromHistory(item)}
                className="group relative aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-900/10 active:scale-95 touch-manipulation"
              >
                <img 
                  src={item.url} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <p className="text-xs text-white line-clamp-2 font-medium mb-1">
                    {item.prompt}
                  </p>
                  <p className="text-[10px] text-zinc-300">
                    {item.aspectRatio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple helper icon for the loading state
const SparkleIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-orange-500"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
  </svg>
);

export default ImageGenerator;