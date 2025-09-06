import React from 'react';

interface MainContentProps {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    onUndo: () => void;
    onRedo: () => void;
    onStartOver: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const MainContent: React.FC<MainContentProps> = ({ imageUrl, isLoading, error, onUndo, onRedo, onStartOver, canUndo, canRedo }) => {
    
    // Check if the Web Share API is supported by the browser.
    const isShareSupported = typeof navigator.share === 'function';

    const handleSave = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `shopsense-creation-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (!imageUrl || !isShareSupported) return;

        try {
            // Convert data URL to blob for the Web Share API
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `shopsense-creation-${Date.now()}.png`, { type: blob.type });

            // Check if the browser can share these files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                 await navigator.share({
                    files: [file],
                    title: 'My ShopSense Creation',
                    text: 'Check out what I made with the ShopSense Workspace!',
                });
            } else {
                // Fallback for unsupported file types, though unlikely for images.
                alert("Sharing this file type is not supported on your device.");
            }
        } catch (err) {
            // This error will be thrown if the user cancels the share dialog.
            // We can safely ignore it.
            if ((err as Error).name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
        }
    };

    return (
        <>
            <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl relative min-h-0">
                {isLoading && (
                     <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[var(--primary-color)]"></div>
                         <p className="mt-4 text-lg font-semibold">Generating...</p>
                     </div>
                )}
                {error && !isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                        <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
                        <p className="mt-4 text-lg font-semibold text-red-400">Generation Failed</p>
                        <p className="mt-1 text-sm text-gray-400 max-w-md">{error}</p>
                    </div>
                )}
                {!isLoading && !error && !imageUrl && (
                    <div className="w-full h-full flex items-center justify-center text-center text-gray-500 p-4">
                        <p>Your generated image will appear here</p>
                    </div>
                )}
                {imageUrl && (
                    <div 
                        className="w-full h-full bg-center bg-no-repeat bg-contain" 
                        style={{ backgroundImage: `url("${imageUrl}")` }}
                    ></div>
                )}
            </div>
            <footer className="flex flex-col md:flex-row items-center justify-between mt-2 md:mt-4 gap-2 md:gap-0 panel p-2 md:p-4">
                <div className="flex items-center gap-2">
                    <button onClick={onUndo} disabled={!canUndo || isLoading} className="btn-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined">undo</span> Undo
                    </button>
                    <button onClick={onRedo} disabled={!canRedo || isLoading} className="btn-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined">redo</span> Redo
                    </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={handleSave} disabled={!imageUrl || isLoading} className="btn-secondary">Save</button>
                    <button onClick={handleShare} disabled={!imageUrl || isLoading || !isShareSupported} className="btn-primary">Share</button>
                    <button onClick={onStartOver} disabled={isLoading} className="btn-secondary !text-red-500 hover:!bg-red-900/50">Start Over</button>
                </div>
            </footer>
        </>
    );
};