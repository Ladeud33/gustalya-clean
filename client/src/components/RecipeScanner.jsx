import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, Loader2, AlertCircle, RotateCcw, Link, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import imageCompression from 'browser-image-compression';

// Detect if we're on Netlify and use direct function URLs
const getApiUrl = (endpoint) => {
  const isNetlify = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname === 'gustalya.app';
  if (isNetlify) {
    if (endpoint === 'scan') return '/.netlify/functions/scan-recipe';
    if (endpoint === 'scan-url') return '/.netlify/functions/scan-url';
  }
  return `/api/recipes/${endpoint}`;
};

const compressImage = async (dataUrl, mimeType) => {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: mimeType });
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    
    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return dataUrl;
  }
};

export function RecipeScanner({ isOpen, onClose, onRecipeExtracted }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState(null); // 'camera', 'file', or 'url'
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const resetState = useCallback(() => {
    setMode(null);
    setImagePreview(null);
    setImageData(null);
    setError(null);
    setIsAnalyzing(false);
    setImageMimeType('image/jpeg');
    setUrlInput('');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const startCamera = useCallback(async () => {
    try {
      setMode('camera');
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setMode(null);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagePreview(dataUrl);
    setImageData(dataUrl);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 10 Mo)");
      return;
    }

    // Store the actual MIME type
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setImagePreview(dataUrl);
      setImageData(dataUrl);
      setMode('file');
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!imageData) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Compress image before sending
      const compressedImageData = await compressImage(imageData, imageMimeType);
      
      const response = await fetch(getApiUrl('scan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: compressedImageData,
          mimeType: 'image/jpeg'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de l\'analyse');
      }

      const recipeData = await response.json();
      onRecipeExtracted(recipeData);
      handleClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse de l'image");
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageData, imageMimeType, onRecipeExtracted, handleClose]);

  const retakePhoto = useCallback(() => {
    setImagePreview(null);
    setImageData(null);
    setError(null);
    if (mode === 'camera') {
      startCamera();
    }
  }, [mode, startCamera]);

  const analyzeUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      setError("Veuillez entrer une URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      setError("L'URL n'est pas valide");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('scan-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de l\'analyse');
      }

      const recipeData = await response.json();
      onRecipeExtracted(recipeData);
      handleClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse de l'URL");
    } finally {
      setIsAnalyzing(false);
    }
  }, [urlInput, onRecipeExtracted, handleClose]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[110]",
      isMobile 
        ? "bg-background" 
        : "grid place-items-center bg-black/50 p-8"
    )}>
      <div className={cn(
        "bg-card flex flex-col",
        isMobile 
          ? "h-[100dvh] w-full overflow-hidden" 
          : "w-full max-w-lg max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl border border-border"
      )}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Scanner une recette</h2>
                <p className="text-sm text-muted-foreground">IA + OCR</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors"
              data-testid="button-close-scanner"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {/* Mode selection */}
          {!mode && !imagePreview && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center py-6">
                <div className="text-5xl mb-4">📸</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Comment capturer la recette ?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Prenez une photo ou sélectionnez une image existante
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={startCamera}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  data-testid="button-use-camera"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Camera className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Prendre une photo</p>
                    <p className="text-sm text-muted-foreground">
                      Utilisez la caméra de votre appareil
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  data-testid="button-upload-file"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                    <Upload className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Choisir une image</p>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez depuis votre galerie
                    </p>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file-scanner"
                />

                <button
                  onClick={() => setMode('url')}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  data-testid="button-use-url"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
                    <Link className="h-7 w-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Importer depuis un lien</p>
                    <p className="text-sm text-muted-foreground">
                      Collez l'URL d'une recette en ligne
                    </p>
                  </div>
                </button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>💡 Conseils :</strong> Pour de meilleurs résultats, prenez une photo bien éclairée et lisible de la recette entière, ou collez le lien d'une recette.
                </p>
              </div>
            </div>
          )}

          {/* URL mode */}
          {mode === 'url' && (
            <div className="space-y-6 animate-in fade-in">
              <button
                onClick={() => setMode(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back-url"
              >
                <ArrowLeft size={18} />
                <span>Retour</span>
              </button>

              <div className="text-center py-4">
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Importer depuis un lien
                </h3>
                <p className="text-muted-foreground text-sm">
                  Collez l'URL d'une page de recette
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://exemple.com/recette..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    data-testid="input-url"
                  />
                  <Link className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={analyzeUrl}
                  disabled={isAnalyzing || !urlInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  data-testid="button-analyze-url"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Analyser avec l'IA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>💡 Astuce :</strong> L'IA va extraire automatiquement le titre, les ingrédients et les étapes depuis la page web.
                </p>
              </div>
            </div>
          )}

          {/* Camera view */}
          {mode === 'camera' && !imagePreview && (
            <div className="flex flex-col h-full animate-in fade-in">
              <div className={cn(
                "relative rounded-2xl overflow-hidden bg-black flex-1",
                isMobile ? "max-h-[60vh]" : "aspect-[4/3]"
              )}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-white/30 rounded-2xl pointer-events-none" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <img 
                  src={imagePreview} 
                  alt="Aperçu de la recette"
                  className="w-full h-auto max-h-[50vh] object-contain"
                />
              </div>

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-foreground font-medium">Analyse en cours...</p>
                  <p className="text-sm text-muted-foreground text-center">
                    L'IA lit et structure votre recette
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-950/30 rounded-xl p-4 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                <button 
                  onClick={retakePhoto}
                  className="text-sm text-red-600 dark:text-red-400 underline mt-1"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "flex-shrink-0 border-t border-border p-4 bg-card",
          isMobile && "pb-[calc(1rem+env(safe-area-inset-bottom))]"
        )}>
          <div className="flex gap-3">
            {mode === 'camera' && !imagePreview && (
              <>
                <button
                  onClick={resetState}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  data-testid="button-capture-photo"
                >
                  <Camera size={20} />
                  Capturer
                </button>
              </>
            )}

            {imagePreview && !isAnalyzing && (
              <>
                <button
                  onClick={retakePhoto}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <RotateCcw size={18} />
                  Reprendre
                </button>
                <button
                  onClick={analyzeImage}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-4 py-3 font-bold text-white hover:opacity-90 transition-opacity"
                  data-testid="button-analyze-recipe"
                >
                  <Sparkles size={18} />
                  Analyser avec l'IA
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
