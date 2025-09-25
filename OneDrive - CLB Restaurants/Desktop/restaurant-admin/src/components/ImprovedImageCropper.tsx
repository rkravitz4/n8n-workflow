'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';

interface ImprovedImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: any, croppedArea: any) => void;
  onApplyCrop: (croppedAreaPixels: any) => void;
  onClose: () => void;
  aspectRatio?: number;
}

interface AspectRatioPreset {
  name: string;
  ratio: number;
  description: string;
}

interface PositionPreset {
  name: string;
  x: number;
  y: number;
  zoom: number;
  description: string;
}

const ImprovedImageCropper: React.FC<ImprovedImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onApplyCrop,
  onClose,
  aspectRatio = 1.56
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentAspectRatio, setCurrentAspectRatio] = useState(aspectRatio);
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Aspect ratio presets
  const aspectRatioPresets: AspectRatioPreset[] = [
    { name: 'Mobile Event', ratio: 1.56, description: 'Mobile event card (1.56:1)' },
    { name: 'Hero Banner', ratio: 16/9, description: 'Wide banner (16:9)' },
    { name: 'Square', ratio: 1, description: 'Perfect square (1:1)' },
    { name: 'Portrait', ratio: 3/4, description: 'Portrait style (3:4)' },
    { name: 'Wide', ratio: 21/9, description: 'Ultra wide (21:9)' },
    { name: 'Original', ratio: aspectRatio, description: 'Original ratio' }
  ];

  // Position presets
  const positionPresets: PositionPreset[] = [
    { name: 'Center', x: 0, y: 0, zoom: 1, description: 'Center the image' },
    { name: 'Focus Top', x: 0, y: -20, zoom: 1.2, description: 'Focus on top portion' },
    { name: 'Focus Bottom', x: 0, y: 20, zoom: 1.2, description: 'Focus on bottom portion' },
    { name: 'Zoom In', x: 0, y: 0, zoom: 1.5, description: 'Zoom in for detail' },
    { name: 'Fit Frame', x: 0, y: 0, zoom: 0.8, description: 'Show more of the image' }
  ];

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    onCropComplete(croppedAreaPixels, croppedArea);
  }, [onCropComplete]);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const handleAspectRatioChange = (ratio: number) => {
    setCurrentAspectRatio(ratio);
  };

  const handlePositionPreset = (preset: PositionPreset) => {
    setCrop({ x: preset.x, y: preset.y });
    setZoom(preset.zoom);
  };

  const handleSave = async () => {
    if (croppedAreaPixels) {
      console.log('Applying crop with pixels:', croppedAreaPixels);
      await onApplyCrop(croppedAreaPixels);
      onClose();
    }
  };

  // Generate mobile preview
  const generateMobilePreview = useCallback(async () => {
    if (!croppedAreaPixels || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to mobile dimensions (375x240 for event card preview)
    const previewWidth = 375;
    const previewHeight = 240;
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // Load and draw the cropped image as hero background
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw the image to fill the canvas
      ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
      
      // Add dark overlay for text readability (like mobile app)
      const overlay = ctx.createLinearGradient(0, previewHeight - 80, 0, previewHeight);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, previewHeight - 80, previewWidth, 80);
      
      // Add sample event title text (like mobile app)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'left';
      ctx.fillText('Sample Event Title', 20, previewHeight - 35);
      
      // Add sample event details
      ctx.font = '14px sans-serif';
      ctx.fillText('Sample Date • Sample Time', 20, previewHeight - 15);
    };
    img.src = imageSrc;
  }, [croppedAreaPixels, imageSrc]);

  useEffect(() => {
    generateMobilePreview();
  }, [generateMobilePreview]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full h-[90vh] flex">
        {/* Main Cropper Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Crop Image for Hero Shot</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Drag the image to reposition, use presets for quick adjustments
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Cropper Container */}
          <div className="relative bg-gray-100 flex-1 min-h-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={currentAspectRatio}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={onZoomChange}
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }
              }}
            />
          </div>

          {/* Controls */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="space-y-4">
              {/* Aspect Ratio Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aspect Ratio Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {aspectRatioPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleAspectRatioChange(preset.ratio)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        Math.abs(currentAspectRatio - preset.ratio) < 0.01
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Position Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {positionPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePositionPreset(preset)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Controls */}
              <div className="grid grid-cols-2 gap-4">
                {/* Zoom Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Mobile Preview Toggle */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setShowMobilePreview(!showMobilePreview)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      showMobilePreview
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📱 Mobile Preview
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!croppedAreaPixels}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Preview Sidebar */}
        {showMobilePreview && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Mobile Event Card Preview</h3>
              <p className="text-sm text-gray-600 mt-1">
                This shows how your image will appear in the mobile app's event card
              </p>
            </div>
            
            <div className="flex-1 p-4 flex flex-col items-center justify-center">
              {/* Mobile Event Card Preview */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden w-64">
                {/* Hero Image with overlay */}
                <div className="relative h-48 bg-gray-200">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                  />
                </div>
                
                {/* Event Card Content (simplified) */}
                <div className="p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-1">Sample Event Title</div>
                  <div className="text-xs text-gray-400">Sample Date • Sample Time</div>
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-gray-600">
                  <strong>Crop Settings:</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Aspect Ratio: {currentAspectRatio.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  Zoom: {Math.round(zoom * 100)}%
                </p>
              </div>
            </div>

            {/* Mobile Preview Tips */}
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <strong>💡 Pro Tips:</strong>
                </div>
                <div className="text-xs text-gray-600">
                  • <strong>Position for text overlay:</strong> Keep important parts in the bottom third where text appears
                </div>
                <div className="text-xs text-gray-600">
                  • <strong>Avoid busy areas:</strong> Don't crop faces or important details where the title will go
                </div>
                <div className="text-xs text-gray-600">
                  • <strong>Use presets:</strong> "Focus Top" works well for most event images
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedImageCropper;
