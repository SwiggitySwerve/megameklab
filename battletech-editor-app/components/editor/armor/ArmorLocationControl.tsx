import React, { useState, useCallback } from 'react';

interface ArmorLocationData {
  location: string;
  armor_points: number;
  rear_armor_points: number;
  maxArmor: number;
  hasRear: boolean;
}

interface ArmorLocationControlProps {
  location: string;
  armorData?: ArmorLocationData;
  onArmorChange: (location: string, front: number, rear: number) => void;
  readOnly?: boolean;
  compact?: boolean;
  showRearArmor?: boolean;
  isSelected?: boolean;
  onSelect?: (location: string | null) => void;
}

const ArmorLocationControl: React.FC<ArmorLocationControlProps> = ({
  location,
  armorData,
  onArmorChange,
  readOnly = false,
  compact = true,
  showRearArmor = true,
  isSelected = false,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempFront, setTempFront] = useState(armorData?.armor_points?.toString() || '0');
  const [tempRear, setTempRear] = useState(armorData?.rear_armor_points?.toString() || '0');

  const frontValue = armorData?.armor_points || 0;
  const rearValue = armorData?.rear_armor_points || 0;
  const maxArmor = armorData?.maxArmor || 0;
  const hasRear = armorData?.hasRear && showRearArmor;

  // Get location abbreviation
  const getLocationAbbr = (location: string): string => {
    const abbrevMap: { [key: string]: string } = {
      'Head': 'HD',
      'Left Arm': 'LA',
      'Right Arm': 'RA',
      'Left Torso': 'LT',
      'Center Torso': 'CT',
      'Right Torso': 'RT',
      'Left Leg': 'LL',
      'Right Leg': 'RL',
    };
    return abbrevMap[location] || location.substring(0, 2).toUpperCase();
  };

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(isSelected ? null : location);
    }
    if (!readOnly) {
      setIsEditing(true);
      setTempFront(frontValue.toString());
      setTempRear(rearValue.toString());
    }
  }, [location, isSelected, onSelect, readOnly, frontValue, rearValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const newFront = Math.max(0, Math.min(parseInt(tempFront) || 0, maxArmor));
    const newRear = Math.max(0, Math.min(parseInt(tempRear) || 0, maxArmor - newFront));
    
    onArmorChange(location, newFront, newRear);
    setIsEditing(false);
  }, [location, tempFront, tempRear, maxArmor, onArmorChange]);

  const handleCancel = useCallback(() => {
    setTempFront(frontValue.toString());
    setTempRear(rearValue.toString());
    setIsEditing(false);
  }, [frontValue, rearValue]);

  const handleIncrement = useCallback((isRear: boolean = false) => {
    if (readOnly) return;
    
    if (isRear) {
      const newRear = Math.min(rearValue + 1, maxArmor - frontValue);
      onArmorChange(location, frontValue, newRear);
    } else {
      const newFront = Math.min(frontValue + 1, maxArmor - (hasRear ? rearValue : 0));
      onArmorChange(location, newFront, rearValue);
    }
  }, [location, frontValue, rearValue, maxArmor, hasRear, readOnly, onArmorChange]);

  const handleDecrement = useCallback((isRear: boolean = false) => {
    if (readOnly) return;
    
    if (isRear) {
      const newRear = Math.max(rearValue - 1, 0);
      onArmorChange(location, frontValue, newRear);
    } else {
      const newFront = Math.max(frontValue - 1, 0);
      onArmorChange(location, newFront, rearValue);
    }
  }, [location, frontValue, rearValue, readOnly, onArmorChange]);

  const isOverLimit = frontValue + rearValue > maxArmor;
  const isAtMax = frontValue + rearValue === maxArmor;

  return (
    <div 
      className={`
        armor-location-control relative border rounded-lg p-2 min-w-[60px] cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}
        ${isOverLimit ? 'border-red-500 bg-red-50' : ''}
        ${isAtMax ? 'border-green-500 bg-green-50' : ''}
        ${readOnly ? 'cursor-default' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={readOnly ? -1 : 0}
      role="button"
      aria-label={`${location} armor control`}
    >
      {/* Location Label */}
      <div className="text-center">
        <div className="text-xs font-semibold text-gray-700 mb-1">
          {getLocationAbbr(location)}
        </div>

        {/* Armor Values */}
        {isEditing ? (
          <div className="space-y-1">
            <input
              type="number"
              value={tempFront}
              onChange={(e) => setTempFront(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              className="w-full text-xs text-center border border-gray-300 rounded px-1 py-0.5"
              min="0"
              max={maxArmor}
              autoFocus
            />
            {hasRear && (
              <input
                type="number"
                value={tempRear}
                onChange={(e) => setTempRear(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={handleKeyDown}
                className="w-full text-xs text-center border border-gray-300 rounded px-1 py-0.5"
                min="0"
                max={maxArmor}
              />
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Front armor */}
            <div className="flex items-center justify-center space-x-1">
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecrement(false);
                  }}
                  className="w-3 h-3 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                  disabled={frontValue <= 0}
                  aria-label="Decrease front armor"
                >
                  −
                </button>
              )}
              <span 
                className={`text-sm font-medium min-w-[20px] text-center ${
                  isOverLimit ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {frontValue}
              </span>
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIncrement(false);
                  }}
                  className="w-3 h-3 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                  disabled={frontValue + rearValue >= maxArmor}
                  aria-label="Increase front armor"
                >
                  +
                </button>
              )}
            </div>

            {/* Rear armor */}
            {hasRear && (
              <div className="flex items-center justify-center space-x-1">
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDecrement(true);
                    }}
                    className="w-3 h-3 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                    disabled={rearValue <= 0}
                    aria-label="Decrease rear armor"
                  >
                    −
                  </button>
                )}
                <span 
                  className={`text-xs font-medium min-w-[16px] text-center ${
                    isOverLimit ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {rearValue}
                </span>
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIncrement(true);
                    }}
                    className="w-3 h-3 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                    disabled={frontValue + rearValue >= maxArmor}
                    aria-label="Increase rear armor"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Max armor indicator */}
        {compact && (
          <div className="text-xs text-gray-400 mt-1">
            /{maxArmor}
          </div>
        )}
      </div>

      {/* Validation indicator */}
      {isOverLimit && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
    </div>
  );
};

export default ArmorLocationControl;
