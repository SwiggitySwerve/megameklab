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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragTarget, setDragTarget] = useState<'front' | 'rear' | null>(null);

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
    const newFront = parseInt(tempFront) || 0;
    const newRear = parseInt(tempRear) || 0;
    
    onArmorChange(location, newFront, newRear);
    setIsEditing(false);
  }, [location, tempFront, tempRear, onArmorChange]);

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

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, target: 'front' | 'rear') => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragTarget(target);
    setDragStartValue(target === 'front' ? frontValue : rearValue);
    
    // Add global mouse move and up handlers
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [readOnly, frontValue, rearValue]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragTarget) return;
    
    const deltaY = dragStartY - e.clientY;
    const sensitivity = 0.5; // Adjust pixels needed per armor point
    const deltaArmor = Math.round(deltaY * sensitivity);
    
    const newValue = dragStartValue + deltaArmor;
    
    if (dragTarget === 'front') {
      onArmorChange(location, newValue, rearValue);
    } else {
      onArmorChange(location, frontValue, newValue);
    }
  }, [isDragging, dragTarget, dragStartY, dragStartValue, frontValue, rearValue, location, onArmorChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
    
    // Remove global handlers
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Mouse wheel handler
  const handleWheel = useCallback((e: React.WheelEvent, isRear: boolean = false) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -1 : 1;
    
    if (isRear) {
      const newRear = rearValue + delta;
      onArmorChange(location, frontValue, newRear);
    } else {
      const newFront = frontValue + delta;
      onArmorChange(location, newFront, rearValue);
    }
  }, [readOnly, frontValue, rearValue, location, onArmorChange]);

  const isOverLimit = frontValue + rearValue > maxArmor;
  const isAtMax = frontValue + rearValue === maxArmor;
  
  // Calculate armor percentage for color coding
  const armorPercentage = maxArmor > 0 
    ? ((frontValue + rearValue) / maxArmor) * 100 
    : 0;
  
  // Determine color based on armor percentage
  const getArmorLevelColor = () => {
    if (frontValue < 0 || rearValue < 0) return 'border-purple-500 bg-purple-900/20'; // Negative values
    if (isOverLimit) return 'border-red-500 bg-red-900/20';
    if (armorPercentage >= 90) return 'border-green-500 bg-green-900/20';
    if (armorPercentage >= 60) return 'border-yellow-500 bg-yellow-900/20';
    if (armorPercentage >= 20) return 'border-orange-500 bg-orange-900/20';
    return 'border-red-500 bg-red-900/20';
  };

  return (
    <div 
      className={`
        armor-location-control relative border-2 rounded-lg p-2 min-w-[60px] cursor-pointer transition-all duration-200
        ${isSelected ? 'border-blue-500 bg-blue-900/30 shadow-md' : getArmorLevelColor()}
        ${!isSelected && !isOverLimit ? 'hover:shadow-sm' : ''}
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
        <div className="text-xs font-semibold text-gray-300 mb-1">
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
              className="w-16 text-sm text-center bg-gray-700 text-gray-100 border border-gray-600 rounded px-1 py-0.5 font-medium mx-auto block"
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
                className="w-16 text-xs text-center bg-gray-700 text-gray-100 border border-gray-600 rounded px-1 py-0.5 mx-auto block"
                min="0"
                max={maxArmor}
              />
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Front armor */}
            <div 
              className={`text-sm font-medium text-center cursor-pointer select-none ${
                isOverLimit ? 'text-red-400' : 'text-gray-100'
              } ${isDragging && dragTarget === 'front' ? 'text-blue-400' : ''} ${
                !readOnly ? 'hover:text-blue-400' : ''
              }`}
              onMouseDown={(e) => !readOnly && handleMouseDown(e, 'front')}
              onWheel={(e) => handleWheel(e, false)}
              style={{ 
                cursor: readOnly ? 'default' : 'pointer'
              }}
              title={readOnly ? '' : 'Click to edit, drag up/down or scroll to adjust'}
            >
              {frontValue}
            </div>

            {/* Rear armor */}
            {hasRear && (
              <div 
                className={`text-xs font-medium text-center cursor-pointer select-none ${
                  isOverLimit ? 'text-red-400' : 'text-gray-400'
                } ${isDragging && dragTarget === 'rear' ? 'text-blue-400' : ''} ${
                  !readOnly ? 'hover:text-blue-400' : ''
                }`}
                onMouseDown={(e) => !readOnly && handleMouseDown(e, 'rear')}
                onWheel={(e) => handleWheel(e, true)}
                style={{ 
                  cursor: readOnly ? 'default' : 'pointer'
                }}
                title={readOnly ? '' : 'Click to edit, drag up/down or scroll to adjust'}
              >
                {rearValue}
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
