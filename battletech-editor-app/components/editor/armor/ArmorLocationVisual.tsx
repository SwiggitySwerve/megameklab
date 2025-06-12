import React, { useState, useCallback, useMemo } from 'react';

interface ArmorLocationVisualProps {
  location: string;
  x: number;
  y: number;
  width: number;
  height: number;
  armorData: {
    front: number;
    rear: number;
    max: number;
  };
  hasRear: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (location: string | null) => void;
  onArmorChange: (front: number, rear: number) => void;
  readOnly: boolean;
  showLabel: boolean;
  showTooltip: boolean;
}

const ArmorLocationVisual: React.FC<ArmorLocationVisualProps> = ({
  location,
  x,
  y,
  width,
  height,
  armorData,
  hasRear,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onArmorChange,
  readOnly,
  showLabel,
  showTooltip,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragTarget, setDragTarget] = useState<'front' | 'rear' | null>(null);

  // Calculate armor percentage
  const totalArmor = armorData.front + armorData.rear;
  const armorPercentage = armorData.max > 0 ? (totalArmor / armorData.max) * 100 : 0;

  // Get fill color based on armor percentage
  const getFillColor = useMemo(() => {
    if (armorPercentage >= 90) return '#10b981'; // green-500
    if (armorPercentage >= 60) return '#eab308'; // yellow-500
    if (armorPercentage >= 20) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  }, [armorPercentage]);

  // Get stroke color based on state
  const getStrokeColor = () => {
    if (isSelected) return '#3b82f6'; // blue-500
    if (isHovered) return '#60a5fa'; // blue-400
    return '#4b5563'; // gray-600
  };

  // Get location abbreviation
  const getLocationAbbr = (loc: string): string => {
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
    return abbrevMap[loc] || loc.substring(0, 2).toUpperCase();
  };

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    onHover(location);
  }, [location, onHover]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      onHover(null);
    }
  }, [isDragging, onHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  // Drag handlers for armor adjustment
  const handleMouseDown = useCallback((e: React.MouseEvent, target: 'front' | 'rear') => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragTarget(target);
    setDragStartValue(target === 'front' ? armorData.front : armorData.rear);
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [readOnly, armorData]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragTarget) return;
    
    const deltaY = dragStartY - e.clientY;
    const sensitivity = 0.5;
    const deltaArmor = Math.round(deltaY * sensitivity);
    
    const newValue = Math.max(0, Math.min(armorData.max, dragStartValue + deltaArmor));
    
    if (dragTarget === 'front') {
      onArmorChange(newValue, armorData.rear);
    } else {
      onArmorChange(armorData.front, newValue);
    }
  }, [isDragging, dragTarget, dragStartY, dragStartValue, armorData, onArmorChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
    
    // Remove global event listeners
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

  // Calculate fill heights
  const frontFillHeight = hasRear ? (height / 2) * (armorData.front / armorData.max) : height * (armorData.front / armorData.max);
  const rearFillHeight = hasRear ? (height / 2) * (armorData.rear / armorData.max) : 0;

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {/* Main location rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#1f2937"
        stroke={getStrokeColor()}
        strokeWidth={isSelected ? 3 : 2}
        rx={4}
        ry={4}
      />

      {/* Front armor fill */}
      <rect
        x={x + 2}
        y={y + height - frontFillHeight - 2}
        width={width - 4}
        height={frontFillHeight}
        fill={getFillColor}
        opacity={0.7}
        rx={2}
        ry={2}
        onMouseDown={(e) => handleMouseDown(e, 'front')}
      />

      {/* Rear armor fill (if applicable) */}
      {hasRear && (
        <>
          <line
            x1={x}
            y1={y + height / 2}
            x2={x + width}
            y2={y + height / 2}
            stroke="#4b5563"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <rect
            x={x + 2}
            y={y + 2}
            width={width - 4}
            height={rearFillHeight}
            fill={getFillColor}
            opacity={0.5}
            rx={2}
            ry={2}
            onMouseDown={(e) => handleMouseDown(e, 'rear')}
          />
        </>
      )}

      {/* Location label */}
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          pointerEvents="none"
        >
          {getLocationAbbr(location)}
        </text>
      )}

      {/* Armor values */}
      <text
        x={x + width / 2}
        y={hasRear ? y + height * 0.75 : y + height / 2 + 15}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="12"
        pointerEvents="none"
      >
        {armorData.front}
      </text>

      {hasRear && (
        <text
          x={x + width / 2}
          y={y + height * 0.25}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#d1d5db"
          fontSize="10"
          pointerEvents="none"
        >
          {armorData.rear}
        </text>
      )}

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <g>
          <rect
            x={x + width + 5}
            y={y}
            width={120}
            height={hasRear ? 80 : 60}
            fill="#1f2937"
            stroke="#4b5563"
            strokeWidth={1}
            rx={4}
            ry={4}
          />
          <text x={x + width + 10} y={y + 15} fill="white" fontSize="12" fontWeight="bold">
            {location}
          </text>
          <text x={x + width + 10} y={y + 30} fill="#d1d5db" fontSize="10">
            Front: {armorData.front}/{armorData.max}
          </text>
          {hasRear && (
            <text x={x + width + 10} y={y + 45} fill="#d1d5db" fontSize="10">
              Rear: {armorData.rear}/{armorData.max}
            </text>
          )}
          <text x={x + width + 10} y={hasRear ? y + 60 : y + 45} fill="#d1d5db" fontSize="10">
            Coverage: {Math.round(armorPercentage)}%
          </text>
        </g>
      )}
    </g>
  );
};

export default ArmorLocationVisual;
