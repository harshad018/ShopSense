import React, { useState, useEffect, useRef } from 'react';
// Fix: Use createPortal from react-dom to fix the return type error and correctly render a modal.
import { createPortal } from 'react-dom';

interface CameraModalProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Use state to hold the portal container, this ensures it's created only once.
    const [container] = useState(() => document.createElement('div'));

    useEffect(() => {
        document.body.appendChild(container);
        return () => {
            document.body.removeChild(container);
        }
    }, [container]);

    useEffect(() => {
        const getCameraStream = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access the camera. Please ensure you have granted permission and are using a secure (HTTPS) connection.");
            }
        };

        getCameraStream();

        // Cleanup stream on component unmount
        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    // Fix: The original dependency array `[stream]` would cause an infinite loop.
    // It should run only once when the component mounts. We disable the lint warning
    // as we are managing the stream's lifecycle manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                setCapturedImage(dataUrl);
            }
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleUsePhoto = () => {
        if (capturedImage) {
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                    onCapture(file);
                });
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 pt-[calc(1rem+var(--safe-area-inset-top))] pb-[calc(1rem+var(--safe-area-inset-bottom))] pl-[calc(1rem+var(--safe-area-inset-left))] pr-[calc(1rem+var(--safe-area-inset-right))]" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
            <div className="bg-[var(--dark-charcoal-gray)] rounded-2xl p-4 md:p-6 w-full max-w-lg text-center relative panel">
                <h2 id="camera-modal-title" className="text-xl font-bold mb-4">Camera Capture</h2>
                
                {error && (
                    <div className="text-red-400">
                        <p>{error}</p>
                        <button onClick={onClose} className="btn-secondary mt-4">Close</button>
                    </div>
                )}

                {!error && (
                    <>
                        <div className="bg-black rounded-lg overflow-hidden relative aspect-video mb-4">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                            ></video>
                             {capturedImage && (
                                <img src={capturedImage} alt="Captured photo" className="w-full h-full object-cover" />
                             )}
                             <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>

                        <div className="flex justify-center gap-4">
                            {capturedImage ? (
                                <>
                                    <button onClick={handleRetake} className="btn-secondary">Retake</button>
                                    <button onClick={handleUsePhoto} className="btn-primary">Use Photo</button>
                                </>
                            ) : (
                                <button
                                    onClick={handleCapture}
                                    disabled={!stream}
                                    className="btn-primary w-16 h-16 rounded-full border-4 border-gray-800 flex items-center justify-center disabled:opacity-50"
                                    aria-label="Capture photo"
                                >
                                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                                </button>
                            )}
                        </div>
                    </>
                )}

                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close camera">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>
    );
    
    // Fix: Return a portal instead of calling ReactDOM.createRoot().render()
    return createPortal(modalContent, container);
};