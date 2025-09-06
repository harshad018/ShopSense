import React, { useState, useCallback, ChangeEvent } from 'react';
import { generateProductPlacement, fileToGenerativePart, dataUrlToGenerativePart } from './services/geminiService';
import { LeftAside } from './components/LeftAside';
import { MainContent } from './components/MainContent';
import { RightAside } from './components/RightAside';
import { CameraModal } from './components/CameraModal';
import { MobileNav } from './components/MobileNav';
import { Part } from '@google/genai';

interface HistoryState {
    imageUrl: string | null;
    prompt: string;
    sceneImage: File | null;
    productImage: File | null;
}

const App: React.FC = () => {
    const [history, setHistory] = useState<HistoryState[]>([{ 
        imageUrl: null, 
        prompt: '', 
        sceneImage: null,
        productImage: null 
    }]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cameraFor, setCameraFor] = useState<'scene' | 'product' | null>(null);
    
    // State for mobile-specific UI flow
    const [mobilePanel, setMobilePanel] = useState<'images' | 'tools' | null>(null);
    const [mobileOnboardingStep, setMobileOnboardingStep] = useState<'product' | 'scene' | 'workspace'>(window.innerWidth < 768 ? 'product' : 'workspace');
    const [highlightTools, setHighlightTools] = useState<boolean>(false);


    const currentState = history[currentHistoryIndex];

    const updateStateAndHistory = (newState: Partial<HistoryState>, action: string) => {
        const newHistoryState = { ...currentState, ...newState, prompt: action };
        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push(newHistoryState);
        setHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    };

    const updateStateWithNewImage = (file: File, imageType: 'scene' | 'product', action: string) => {
        const newHistoryState: HistoryState = {
            ...currentState,
            // Do not update imageUrl here, only the source file
            sceneImage: imageType === 'scene' ? file : currentState.sceneImage,
            productImage: imageType === 'product' ? file : currentState.productImage,
            prompt: action
        };

        if (!currentState.sceneImage && !currentState.productImage) {
             setHistory([newHistoryState]);
             setCurrentHistoryIndex(0);
        } else {
             const newHistory = history.slice(0, currentHistoryIndex + 1);
             newHistory.push(newHistoryState);
             setHistory(newHistory);
             setCurrentHistoryIndex(newHistory.length - 1);
        }
        
        if (window.innerWidth < 768 && imageType === 'product') {
            setMobileOnboardingStep('scene');
        }
    };

    const handleImageUpload = (
        event: ChangeEvent<HTMLInputElement>,
        imageType: 'scene' | 'product'
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            updateStateWithNewImage(file, imageType, `Uploaded ${imageType} image`);
        }
    };

    const handleSceneUrlUpload = (file: File) => {
        updateStateWithNewImage(file, 'scene', `Imported scene from URL`);
    };

    const handleProductUrlUpload = (file: File) => {
        updateStateWithNewImage(file, 'product', `Imported product from URL`);
    };
    
    const handleImageCapture = (file: File) => {
        if (cameraFor) {
            updateStateWithNewImage(file, cameraFor, `Captured ${cameraFor} image from camera`);
            setCameraFor(null); // Close modal on success
        }
    };

    const handleOpenCamera = (imageType: 'scene' | 'product') => {
        setCameraFor(imageType);
    };
    
    const handleGenerate = useCallback(async (actionPrompt: string, onSuccess?: () => void) => {
        // The base for generation is either the existing generated image or the initial scene photo.
        const hasBaseImage = currentState.imageUrl || currentState.sceneImage;
        if (!hasBaseImage) {
            setError("Please upload a scene photo first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const isFirstGeneration = !history.some(s => s.imageUrl);
        const finalPrompt = actionPrompt.trim() === '' ? "Place the product naturally in the scene." : actionPrompt;

        try {
            let scenePart: Part;
            let productPart: Part | null = null;
            
            // If an image has already been generated, use it as the base for the next edit.
            // Do not pass the product image again, as the product is already in the scene.
            if (currentState.imageUrl) {
                scenePart = dataUrlToGenerativePart(currentState.imageUrl);
            } 
            // Otherwise, this is the first generation. Use the uploaded scene and product images.
            else if (currentState.sceneImage) {
                scenePart = await fileToGenerativePart(currentState.sceneImage);
                if (currentState.productImage) {
                    productPart = await fileToGenerativePart(currentState.productImage);
                }
            } else {
                // This case is already handled by the hasBaseImage check, but for type safety:
                throw new Error("No base image available for generation.");
            }
            
            const resultUrl = await generateProductPlacement(
                scenePart,
                productPart,
                finalPrompt
            );

            updateStateAndHistory({ imageUrl: resultUrl }, finalPrompt);
            setPrompt(''); // Clear input after successful generation
            if (window.innerWidth < 768) {
                setMobileOnboardingStep('workspace');
            }
            if (isFirstGeneration) {
                setHighlightTools(true);
            }
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [currentState, currentHistoryIndex, history]);

    const handleInitiateGeneration = () => {
        // On mobile, switch to the main workspace view immediately
        // so the user can see the loading state.
        if (mobilePanel) {
            setMobilePanel(null);
        }
        handleGenerate(prompt);
    };

    const handleApplyLook = (lookName: string) => {
        const lookPrompt = `Apply a '${lookName}' look to the image.`;
        setPrompt(lookPrompt);
        handleGenerate(lookPrompt);
    };

    const handleUndo = () => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(currentHistoryIndex - 1);
        }
    };

    const handleRedo = () => {
        if (currentHistoryIndex < history.length - 1) {
            setCurrentHistoryIndex(currentHistoryIndex - 1);
        }
    };
    
    const handleStartOver = () => {
        setHistory([{ imageUrl: null, prompt: '', sceneImage: null, productImage: null }]);
        setCurrentHistoryIndex(0);
        setPrompt('');
        setError(null);
        setIsLoading(false);
        if (window.innerWidth < 768) {
            setMobileOnboardingStep('product');
        }
    };

    const handleNavClick = (panel: 'images' | 'tools' | null) => {
        if (panel === 'tools') {
            setHighlightTools(false);
        }
        if (panel === mobilePanel) {
            setMobilePanel(null); // Toggle off if already active
        } else {
            setMobilePanel(panel);
        }
    };

    const isMobile = window.innerWidth < 768;

    if (isMobile && mobileOnboardingStep !== 'workspace') {
        return (
             <div className="flex h-screen w-full relative">
                <LeftAside
                    onSceneUpload={(e) => handleImageUpload(e, 'scene')}
                    onSceneUrlUpload={handleSceneUrlUpload}
                    onProductUpload={(e) => handleImageUpload(e, 'product')}
                    onProductUrlUpload={handleProductUrlUpload}
                    onOpenCamera={handleOpenCamera}
                    sceneImage={currentState.sceneImage}
                    productImage={currentState.productImage}
                    isMobile={true}
                    onCreate={handleInitiateGeneration}
                    isLoading={isLoading}
                    mobileOnboardingStep={mobileOnboardingStep}
                />
                {cameraFor && (
                    <CameraModal 
                        onCapture={handleImageCapture}
                        onClose={() => setCameraFor(null)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full relative">
            {/* --- Left Aside (Desktop & Mobile Overlay) --- */}
            <div className={`
                ${mobilePanel === 'images' ? 'absolute bg-gray-900 inset-0 z-30' : 'hidden'}
                md:static md:flex md:bg-transparent
            `}>
                <LeftAside
                    onSceneUpload={(e) => handleImageUpload(e, 'scene')}
                    onSceneUrlUpload={handleSceneUrlUpload}
                    onProductUpload={(e) => handleImageUpload(e, 'product')}
                    onProductUrlUpload={handleProductUrlUpload}
                    onOpenCamera={handleOpenCamera}
                    sceneImage={currentState.sceneImage}
                    productImage={currentState.productImage}
                    isMobile={mobilePanel === 'images'}
                    onClose={() => setMobilePanel(null)}
                    onCreate={handleInitiateGeneration}
                    isLoading={isLoading}
                />
            </div>
            
            <main className="flex-1 flex flex-col p-4 pb-24 md:pb-4 min-w-0">
                <MainContent
                    imageUrl={currentState.imageUrl}
                    isLoading={isLoading}
                    error={error}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onStartOver={handleStartOver}
                    canUndo={currentHistoryIndex > 0}
                    canRedo={currentHistoryIndex < history.length - 1}
                />
            </main>

            {/* --- Right Aside (Desktop & Mobile Overlay) --- */}
             <div className={`
                ${mobilePanel === 'tools' ? 'absolute bg-gray-900 inset-0 z-30' : 'hidden'}
                md:static md:flex md:bg-transparent
            `}>
                <RightAside
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onGenerate={() => handleGenerate(prompt)}
                    history={history.slice(1).map(h => h.prompt)} // show actions after initial state
                    onApplyLook={handleApplyLook}
                    isLoading={isLoading}
                    disabled={!currentState.sceneImage && !currentState.imageUrl}
                    isMobile={mobilePanel === 'tools'}
                    onClose={() => setMobilePanel(null)}
                />
            </div>

            {/* --- Mobile Navigation --- */}
            <MobileNav onNavClick={handleNavClick} activePanel={mobilePanel} highlightTools={highlightTools} />

            {cameraFor && (
                <CameraModal 
                    onCapture={handleImageCapture}
                    onClose={() => setCameraFor(null)}
                />
            )}
        </div>
    );
};
export default App;