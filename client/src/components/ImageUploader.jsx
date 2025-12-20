import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image, Link } from 'lucide-react';
import { cn } from '../lib/utils';

export function ImageUploader({ value, onChange, className }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }
    
    setError(null);
    setUploading(true);
    
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (err) {
      console.error('Conversion failed:', err);
      setError('Échec de la conversion de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      setShowUrlInput(false);
      setUrlValue('');
    }
  };

  const removeImage = () => {
    onChange('');
  };

  if (value) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        <img 
          src={value} 
          alt="Aperçu" 
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <button
          type="button"
          onClick={removeImage}
          data-testid="button-remove-image"
          className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (showUrlInput) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://exemple.com/photo.jpg"
            className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            OK
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(false)}
          className="text-sm text-primary hover:underline"
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-xl border-2 border-dashed border-border bg-background p-6 text-center">
        {uploading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Traitement en cours...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Image size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Ajouter une photo</p>
            </div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-file"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Upload size={16} />
                Fichier
              </button>
              
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                data-testid="button-take-photo"
                className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Camera size={16} />
                Photo
              </button>
              
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                data-testid="button-url-input"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Link size={16} />
                URL
              </button>
            </div>
            
            <p className="mt-3 text-xs text-muted-foreground/60">
              JPG, PNG • Max 5 Mo • Gratuit !
            </p>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          data-testid="input-file-upload"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          data-testid="input-camera-capture"
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
