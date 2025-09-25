'use client';

interface TextStyleControlsProps {
  label: string;
  color: string;
  bold: boolean;
  onColorChange: (color: string) => void;
  onBoldChange: (bold: boolean) => void;
  recommendedColor?: string;
  recommendedBold?: boolean;
}

const colorOptions = [
  { value: '#000000', label: 'Black', preview: 'bg-black' },
  { value: '#ffffff', label: 'White', preview: 'bg-white border border-gray-300' },
  { value: '#810000', label: 'Maroon', preview: 'bg-red-800' },
  { value: '#ab974f', label: 'Gold', preview: 'bg-yellow-600' }
];

export default function TextStyleControls({ 
  label, 
  color, 
  bold, 
  onColorChange, 
  onBoldChange,
  recommendedColor,
  recommendedBold
}: TextStyleControlsProps) {
  return (
    <div className="space-y-3">
      {/* Recommended settings note - only show if there's a recommendation */}
      {recommendedColor && (
        <div className="text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
          💡 Recommended: {colorOptions.find(c => c.value === recommendedColor)?.label}
          {recommendedBold !== undefined && (
            <span className="ml-1">
              {recommendedBold ? ', Bold' : ', Normal'}
            </span>
          )}
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <div className="flex space-x-3">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onColorChange(option.value)}
                className={`w-7 h-7 rounded-full ${option.preview} ${
                  color === option.value 
                    ? 'border-3 border-gray-800 scale-110' 
                    : 'border border-gray-300'
                } hover:border-2 hover:border-gray-400 transition-all duration-200`}
                title={option.label}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-800">
            Selected: {colorOptions.find(c => c.value === color)?.label}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Bold:</label>
          <input
            type="checkbox"
            checked={bold}
            onChange={(e) => onBoldChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-2"
          />
        </div>
      </div>
    </div>
  );
}
