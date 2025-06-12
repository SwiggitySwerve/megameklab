import React, { useMemo } from 'react';
import { EditableUnit, ArmorType } from '../../../types/editor';

interface ArmorStatisticsPanelProps {
  unit: EditableUnit;
  armorType: ArmorType;
  totalTonnage: number;
  maxTonnage: number;
}

interface LocationStats {
  location: string;
  front: number;
  rear: number;
  max: number;
  percentage: number;
  efficiency: number;
}

const ArmorStatisticsPanel: React.FC<ArmorStatisticsPanelProps> = ({
  unit,
  armorType,
  totalTonnage,
  maxTonnage,
}) => {
  // Calculate location statistics
  const locationStats = useMemo((): LocationStats[] => {
    const stats: LocationStats[] = [];
    const locations = [
      'Head', 'Center Torso', 'Left Torso', 'Right Torso',
      'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'
    ];

    locations.forEach(location => {
      const armorLocation = unit.data?.armor?.locations?.find(loc => loc.location === location);
      const front = armorLocation?.armor_points || 0;
      const rear = armorLocation?.rear_armor_points || 0;
      const max = getMaxArmorForLocation(location, unit.mass || 0);
      const total = front + rear;
      const percentage = max > 0 ? (total / max) * 100 : 0;
      const efficiency = total > 0 ? total / (total * 0.0625) : 0; // Points per ton efficiency

      stats.push({
        location,
        front,
        rear,
        max,
        percentage,
        efficiency,
      });
    });

    return stats;
  }, [unit]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalPoints = locationStats.reduce((sum, loc) => sum + loc.front + loc.rear, 0);
    const maxPossiblePoints = locationStats.reduce((sum, loc) => sum + loc.max, 0);
    const coveragePercentage = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
    const pointsPerTon = totalTonnage > 0 ? totalPoints / totalTonnage : 0;
    const efficiency = armorType?.pointsPerTon ? (pointsPerTon / armorType.pointsPerTon * 100) : 0;

    // Front/rear ratio for torso locations
    const torsoLocations = locationStats.filter(loc => 
      ['Center Torso', 'Left Torso', 'Right Torso'].includes(loc.location)
    );
    const totalFront = torsoLocations.reduce((sum, loc) => sum + loc.front, 0);
    const totalRear = torsoLocations.reduce((sum, loc) => sum + loc.rear, 0);
    const frontRearRatio = totalRear > 0 ? totalFront / totalRear : totalFront;

    return {
      totalPoints,
      maxPossiblePoints,
      coveragePercentage,
      pointsPerTon,
      efficiency,
      frontRearRatio,
      remainingTonnage: maxTonnage - totalTonnage,
      remainingPoints: Math.floor((maxTonnage - totalTonnage) * (armorType?.pointsPerTon || 0)),
    };
  }, [locationStats, totalTonnage, maxTonnage, armorType.pointsPerTon]);

  // Identify vulnerable locations
  const vulnerableLocations = useMemo(() => {
    return locationStats.filter(loc => loc.percentage < 50);
  }, [locationStats]);

  // Get max armor for location based on mech tonnage
  function getMaxArmorForLocation(location: string, mass: number): number {
    switch (location) {
      case 'Head':
        return mass > 100 ? 12 : 9;
      case 'Center Torso':
        return Math.floor(mass * 2 * 0.4);
      case 'Left Torso':
      case 'Right Torso':
        return Math.floor(mass * 2 * 0.3);
      case 'Left Arm':
      case 'Right Arm':
      case 'Left Leg':
      case 'Right Leg':
        return Math.floor(mass * 2 * 0.25);
      default:
        return Math.floor(mass * 2 * 0.2);
    }
  }

  return (
    <div className="armor-statistics-panel bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-100 mb-4">Armor Statistics</h3>

      {/* Overall Statistics */}
      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Overall</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-400">Total Armor Points</div>
            <div className="text-lg font-bold text-gray-100">
              {overallStats.totalPoints} / {overallStats.maxPossiblePoints}
            </div>
            <div className="text-gray-500">{(overallStats.coveragePercentage || 0).toFixed(1)}% coverage</div>
          </div>
          
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-400">Weight Efficiency</div>
            <div className="text-lg font-bold text-gray-100">
              {(overallStats.pointsPerTon || 0).toFixed(1)} pts/ton
            </div>
            <div className="text-gray-500">{(overallStats.efficiency || 0).toFixed(1)}% efficient</div>
          </div>

          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-400">Armor Tonnage</div>
            <div className="text-lg font-bold text-gray-100">
              {(totalTonnage || 0).toFixed(1)} / {(maxTonnage || 0).toFixed(1)} tons
            </div>
            <div className="text-gray-500">{(overallStats.remainingTonnage || 0).toFixed(1)} tons remaining</div>
          </div>

          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-400">Front/Rear Ratio</div>
            <div className="text-lg font-bold text-gray-100">
              {(overallStats.frontRearRatio || 0).toFixed(1)}:1
            </div>
            <div className="text-gray-500">Torso locations only</div>
          </div>
        </div>
      </div>

      {/* Per-Location Breakdown */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Location Breakdown</h4>
        <div className="space-y-1">
          {locationStats.map((loc) => (
            <div key={loc.location} className="flex items-center gap-2 text-xs">
              <div className="w-20 text-gray-400">{loc.location}</div>
              <div className="flex-1">
                <div className="relative h-4 bg-gray-700 rounded overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                      loc.percentage >= 90 ? 'bg-green-500' :
                      loc.percentage >= 60 ? 'bg-yellow-500' :
                      loc.percentage >= 20 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${loc.percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-100">
                    {loc.front}{loc.rear > 0 ? `/${loc.rear}` : ''} ({loc.percentage.toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div className="text-gray-400 w-16 text-right">
                Max: {loc.max}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerable Locations Warning */}
      {vulnerableLocations.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded p-3">
          <h4 className="text-xs font-medium text-red-400 mb-1">Vulnerable Locations</h4>
          <div className="text-xs text-red-300">
            {vulnerableLocations.map(loc => loc.location).join(', ')} have less than 50% armor coverage
          </div>
        </div>
      )}

      {/* Remaining Points */}
      {overallStats.remainingPoints > 0 && (
        <div className="mt-3 bg-blue-900/20 border border-blue-700 rounded p-3">
          <div className="text-xs text-blue-300">
            You can allocate {overallStats.remainingPoints} more armor points with remaining tonnage
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmorStatisticsPanel;
