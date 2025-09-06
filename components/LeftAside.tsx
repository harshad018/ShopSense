import React, { useRef, ChangeEvent, useState, useEffect } from 'react';

interface LeftAsideProps {
    onSceneUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onSceneUrlUpload: (file: File) => void;
    onProductUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onProductUrlUpload: (file: File) => void;
    onOpenCamera: (imageType: 'scene' | 'product') => void;
    sceneImage: File | null;
    productImage: File | null;
    isMobile?: boolean;
    onClose?: () => void;
    onCreate: () => void;
    isLoading: boolean;
    mobileOnboardingStep?: 'product' | 'scene' | 'workspace';
}

interface ImageUploaderProps {
    title: string;
    description: string;
    onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpenCamera: () => void;
    imageFile: File | null;
    allowUrlUpload?: boolean;
    onUrlUpload?: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    title, 
    description, 
    onUpload, 
    onOpenCamera, 
    imageFile,
    allowUrlUpload,
    onUrlUpload
 }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);

            return () => {
                URL.revokeObjectURL(url);
                setPreviewUrl(null); // Clean up on dismount or file change
            };
        } else {
            setPreviewUrl(null);
        }
    }, [imageFile]);


    const handleFetchFromUrl = async () => {
        if (!imageUrl || !onUrlUpload) return;
        
        setIsFetching(true);
        setFetchError(null);
        
        // Use a public CORS proxy to bypass browser security restrictions.
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image. Status: ${response.status}`);
            }
            const blob = await response.blob();
            
            // More robust validation: try to load the blob as an image to ensure it's valid.
            const isImage = await new Promise(resolve => {
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(true);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(false);
                };
                img.src = url;
            });
            
            if (!isImage) {
                throw new Error('The URL did not provide a valid image. Please use a direct link to an image file.');
            }

            // Fallback for missing MIME type and extension
            const mimeType = blob.type || 'image/jpeg';
            const extension = mimeType.split('/')[1] || 'jpg';
            const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1).split('?')[0] || `product-from-url.${extension}`;
            const file = new File([blob], fileName, { type: mimeType });
            
            onUrlUpload(file);
            
            // Reset on success
            setShowUrlInput(false);
            setImageUrl('');

        } catch (error: any) {
            console.error("Error fetching image from URL:", error);
            setFetchError(error.message || "An error occurred. Please check the URL and try again.");
        } finally {
            setIsFetching(false);
        }
    }


    return (
        <div className="flex flex-col gap-3">
             <h3 className="font-semibold text-white">{title}</h3>
             <div className="relative border-2 border-dashed border-[var(--border-color)] rounded-xl aspect-video flex flex-col items-center justify-center text-center overflow-hidden bg-gray-900/50">
                {previewUrl ? (
                    <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" alt={`${title} preview`} />
                ) : (
                    <p className="text-sm text-gray-400 p-4">{description}</p>
                )}
            </div>
            <div className="flex gap-2">
                 <button onClick={() => inputRef.current?.click()} className="w-full btn-secondary flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">upload</span>
                    {imageFile ? 'Replace' : 'Upload'}
                </button>
                <button onClick={onOpenCamera} className="btn-secondary flex items-center justify-center gap-2" aria-label={`Use camera for ${title}`}>
                    <span className="material-symbols-outlined">photo_camera</span>
                </button>
                {allowUrlUpload && (
                    <button onClick={() => setShowUrlInput(!showUrlInput)} className="btn-secondary flex items-center justify-center gap-2" aria-label={`Upload ${title} from URL`}>
                        <span className="material-symbols-outlined">link</span>
                    </button>
                )}
             </div>
            <input type="file" ref={inputRef} onChange={onUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
            {allowUrlUpload && showUrlInput && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                         <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleFetchFromUrl()}}
                            placeholder="Paste image URL"
                            className="flex-1 form-input w-full min-w-0 rounded-full text-white focus:outline-0 focus:ring-2 focus:ring-[var(--primary-color)] border border-[var(--border-color)] bg-gray-700 h-10 placeholder:text-gray-400 p-3 text-sm font-normal disabled:opacity-50"
                            disabled={isFetching}
                        />
                        <button onClick={handleFetchFromUrl} disabled={isFetching || !imageUrl} className="btn-secondary !rounded-full h-10 px-4 flex-shrink-0">
                            {isFetching ? '...' : 'Fetch'}
                        </button>
                    </div>
                    {fetchError && <p className="text-xs text-red-400 text-center px-2">{fetchError}</p>}
                    <p className="text-xs text-gray-500 text-center px-2">Paste a direct link to an image (e.g., ending in .jpg, .png).</p>
                </div>
            )}
        </div>
    );
};


export const LeftAside: React.FC<LeftAsideProps> = ({ 
    onSceneUpload,
    onSceneUrlUpload,
    onProductUpload, 
    onProductUrlUpload,
    onOpenCamera, 
    sceneImage, 
    productImage, 
    isMobile, 
    onClose,
    onCreate,
    isLoading,
    mobileOnboardingStep
}) => {
    const asideClasses = isMobile 
        ? "w-full h-full p-4 pt-[calc(1rem+var(--safe-area-inset-top))] pb-[calc(1rem+var(--safe-area-inset-bottom))] pl-[calc(1rem+var(--safe-area-inset-left))] pr-[calc(1rem+var(--safe-area-inset-right))] flex flex-col gap-6 bg-[var(--deep-blue)]"
        : "w-80 p-6 flex flex-col gap-6 panel m-4";
        
    const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (mobileOnboardingStep === 'scene' && productImage) {
            const url = URL.createObjectURL(productImage);
            setProductPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [mobileOnboardingStep, productImage]);

    if (isMobile && (mobileOnboardingStep === 'product' || mobileOnboardingStep === 'scene')) {
         return (
            <aside className="w-full h-full p-4 pt-[calc(2rem+var(--safe-area-inset-top))] pb-[calc(1rem+var(--safe-area-inset-bottom))] pl-[calc(1rem+var(--safe-area-inset-left))] pr-[calc(1rem+var(--safe-area-inset-right))] flex flex-col gap-6 bg-[var(--deep-blue)]">
                {mobileOnboardingStep === 'product' && (
                    <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">Step 1: Upload Product</h2>
                            <p className="text-gray-400 mt-2">Start by adding the item you want to feature.</p>
                        </div>
                        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                             <ImageUploader 
                                title="Product Photo"
                                description="The item to place in the scene."
                                onUpload={onProductUpload}
                                onOpenCamera={() => onOpenCamera('product')}
                                imageFile={productImage}
                                allowUrlUpload={true}
                                onUrlUpload={onProductUrlUpload}
                            />
                        </div>
                         <div className="h-16 flex-shrink-0"></div>
                    </>
                )}
                {mobileOnboardingStep === 'scene' && (
                     <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">Step 2: Choose Scene</h2>
                            <p className="text-gray-400 mt-2">Now, select a background for your product.</p>
                        </div>

                        {productPreviewUrl && (
                             <div className="flex flex-col items-center gap-2">
                                <p className="text-sm font-semibold text-gray-300">Your Product:</p>
                                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-[var(--border-color)] flex-shrink-0">
                                    <img src={productPreviewUrl} alt="Product preview" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                        
                        <div className="max-w-sm mx-auto w-full">
                            <ImageUploader 
                                title="Scene Photo"
                                description="The background for your product."
                                onUpload={onSceneUpload}
                                onOpenCamera={() => onOpenCamera('scene')}
                                imageFile={sceneImage}
                                allowUrlUpload={true}
                                onUrlUpload={onSceneUrlUpload}
                            />
                        </div>

                        <div className="mt-auto pt-4 max-w-sm mx-auto w-full">
                            <button 
                                onClick={onCreate} 
                                disabled={!sceneImage || isLoading}
                                className="w-full btn-primary text-lg"
                            >
                                {isLoading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </>
                )}
            </aside>
        );
    }

    return (
        <aside className={asideClasses}>
            {isMobile && (
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Your Images</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close panel">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}
            {!isMobile && <h2 className="text-xl font-bold text-white">Your Images</h2>}

            <ImageUploader 
                title="Scene Photo"
                description="The background for your product."
                onUpload={onSceneUpload}
                onOpenCamera={() => onOpenCamera('scene')}
                imageFile={sceneImage}
                allowUrlUpload={true}
                onUrlUpload={onSceneUrlUpload}
            />
             <ImageUploader 
                title="Product Photo"
                description="The item to place in the scene."
                onUpload={onProductUpload}
                onOpenCamera={() => onOpenCamera('product')}
                imageFile={productImage}
                allowUrlUpload={true}
                onUrlUpload={onProductUrlUpload}
            />

            <div className="mt-auto pt-4">
                <button 
                    onClick={onCreate} 
                    disabled={!sceneImage || isLoading}
                    className="w-full btn-primary text-lg"
                >
                    {isLoading ? 'Creating...' : 'Create'}
                </button>
            </div>
        </aside>
    );
};