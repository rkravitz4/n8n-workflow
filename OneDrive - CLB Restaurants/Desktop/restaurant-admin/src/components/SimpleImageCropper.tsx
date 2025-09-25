'use client';

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/imageUtils';

interface SimpleImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: any, croppedArea: any) => void;
  onApplyCrop: (croppedAreaPixels: any) => Promise<void>;
  onClose: () => void;
}

const SimpleImageCropper: React.FC<SimpleImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onApplyCrop,
  onClose,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobile event card aspect ratio: 3:1 (3 inches wide, 1 inch tall)
  const aspectRatio = 3;

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    onCropComplete(croppedAreaPixels, croppedArea);
  }, [onCropComplete]);

  const handleApplyCrop = async () => {
    if (croppedAreaPixels) {
      await onApplyCrop(croppedAreaPixels);
      onClose();
    }
  };

  // Generate mobile preview
  const generateMobilePreview = useCallback(async () => {
    if (!croppedAreaPixels || !canvasRef.current) return;

    try {
      // Generate the actual cropped image
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob);

      // Set the canvas to show the cropped result
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to mobile event card dimensions (3:1 ratio)
      const previewWidth = 300;
      const previewHeight = 100;
      canvas.width = previewWidth;
      canvas.height = previewHeight;

      // Load and draw the actual cropped image
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, previewWidth, previewHeight);
        ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
        // Clean up the blob URL
        URL.revokeObjectURL(croppedImageUrl);
      };
      img.src = croppedImageUrl;
    } catch (error) {
      console.error('Error generating mobile preview:', error);
    }
  }, [croppedAreaPixels, imageSrc]);

  React.useEffect(() => {
    generateMobilePreview();
  }, [generateMobilePreview]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Crop Image for Mobile Event Card</h2>
          <p className="text-sm text-gray-600 mt-1">
            Crop your image to fit the mobile event card (3:1 ratio)
          </p>
        </div>

        <div className="flex h-[600px]">
          {/* Main Cropping Area */}
          <div className="flex-1 relative">
            <div className="h-full w-full relative">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                showGrid={true}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  },
                }}
              />
            </div>

            {/* Simple Controls */}
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Drag the image to position it. Focus on the center area since that's what's most visible.
              </p>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Mobile Preview</h3>
              <p className="text-sm text-gray-600 mt-1">
                This is how your image will appear in the mobile app
              </p>
            </div>
            
            <div className="flex-1 p-4 flex flex-col items-center justify-center">
              {/* Mobile Event Card Preview */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden w-64">
                {/* Hero Image - Full width, proper height for 3:1 ratio */}
                <div className="relative bg-gray-200" style={{ aspectRatio: '3/1' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                  />
                </div>
                
                {/* Event Card Content */}
                <div className="p-4 bg-white">
                  <div className="text-base font-bold text-gray-900 mb-2">Sample Event Title</div>
                  <div className="text-sm text-gray-600 mb-2">Sample description text that shows how the event details will appear below the cropped image.</div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📅 Sample Date</span>
                    <span>🕐 Sample Time</span>
                  </div>
                  <div className="mt-3">
                    <button className="w-full bg-red-600 text-white py-2 px-4 rounded text-sm font-medium">
                      Reserve Now
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  <strong>Ratio:</strong> 3:1 (Mobile Event Card)
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Zoom:</strong> {Math.round(zoom * 100)}%
                </p>
              </div>
            </div>

            {/* Simple Tips */}
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <strong>💡 Simple Tips:</strong>
                </div>
                <div className="text-xs text-gray-600">
                  • Drag the image to position it
                </div>
                <div className="text-xs text-gray-600">
                  • Use zoom to get the right size
                </div>
                <div className="text-xs text-gray-600">
                  • Focus on the center area
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCrop}
            disabled={!croppedAreaPixels}
            className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleImageCropper;
