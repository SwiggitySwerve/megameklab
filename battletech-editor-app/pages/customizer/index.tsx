import React, { useState, useEffect } from 'react';
    import Layout from '../../components/common/Layout';
    import UnitDisplayPanel from '../../components/customizer/UnitDisplayPanel';
    import CriticalsPanel from '../../components/customizer/CriticalsPanel';
    import EquipmentPickerPanel from '../../components/customizer/EquipmentPickerPanel';
    import ValidationMessagesPanel from '../../components/customizer/ValidationMessagesPanel';
    import { CustomizableUnit, EquipmentItem, UnitEquipmentItem, CriticalLocation, ApiListResponse, EquipmentToRemoveDetails } from '../../types/customizer';

    const HARDCODED_UNIT_ID = '1'; // Using '1' as a placeholder BattleMech ID

    const CustomizerPage: React.FC = () => {
      const [selectedUnit, setSelectedUnit] = useState<CustomizableUnit | null>(null);
      const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([]);
      const [customizedLoadout, setCustomizedLoadout] = useState<UnitEquipmentItem[]>([]);
      const [customizedCriticals, setCustomizedCriticals] = useState<CriticalLocation[]>([]);

      const [isLoadingUnit, setIsLoadingUnit] = useState<boolean>(true); // Start true
      const [isLoadingEquipment, setIsLoadingEquipment] = useState<boolean>(true); // Start true
      const [error, setError] = useState<string | null>(null);

      const [selectedEquipmentForAdding, setSelectedEquipmentForAdding] = useState<EquipmentItem | null>(null);
      const [targetLocation, setTargetLocation] = useState<string | null>(null);
      const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
      const [equipmentToRemove, setEquipmentToRemove] = useState<EquipmentToRemoveDetails | null>(null);
      const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

      const [variantName, setVariantName] = useState<string>("");
      const [variantNotes, setVariantNotes] = useState<string>("");
      const [saveStatus, setSaveStatus] = useState<string | null>(null);
      const [isSaving, setIsSaving] = useState<boolean>(false);

      const isEmptySlot = (slotContent: string): boolean => {
        return slotContent === null || slotContent === undefined || slotContent.trim() === "" || slotContent.toLowerCase().includes("-empty-");
      };

      const handleSelectEquipment = (equipment: EquipmentItem) => {
        setSelectedEquipmentForAdding(equipment);
        setTargetLocation(null); // Clear target slot when new equipment is picked
        setTargetSlotIndex(null);
        setEquipmentToRemove(null); // Clear removal target
      };

      const handleSelectSlot = (location: string, slotIndex: number, slotContent: string) => {
        if (isEmptySlot(slotContent)) {
          // Logic for adding equipment (selection of empty slot)
          setTargetLocation(location);
          setTargetSlotIndex(slotIndex);
          setEquipmentToRemove(null); // Clear removal target if empty slot is selected
        } else {
          // Logic for selecting equipment to be removed
          const locData = customizedCriticals.find(l => l.location === location);
          if (!locData) return;

          let startIndex = slotIndex;
          while (startIndex > 0 && locData.slots[startIndex - 1] === slotContent) {
            startIndex--;
          }

          let endIndex = slotIndex;
          while (endIndex < locData.slots.length - 1 && locData.slots[endIndex + 1] === slotContent) {
            endIndex++;
          }
          const count = endIndex - startIndex + 1;

          setEquipmentToRemove({ name: slotContent, location, startIndex, count });
          setSelectedEquipmentForAdding(null); // Clear adding target
          setTargetLocation(null);
          setTargetSlotIndex(null);
          console.log(`Selected for removal: ${slotContent} at ${location} from slot ${startIndex + 1} to ${endIndex + 1} (${count} slots)`);
        }
      };

      const handleAddEquipment = () => {
        if (!selectedEquipmentForAdding || targetLocation === null || targetSlotIndex === null) {
          alert("Please select equipment and an empty target slot.");
          return;
        }

        const { critical_slots: slotsNeeded, name: equipmentName, internal_id: equipmentInternalId, type: equipmentType } = selectedEquipmentForAdding;

        let placementSuccessful = false;
        const newCriticalsState = customizedCriticals.map(loc => {
          if (loc.location === targetLocation) {
            const currentSlots = [...loc.slots];
            let canFit = true;
            for (let i = 0; i < slotsNeeded; i++) {
              if (targetSlotIndex + i >= currentSlots.length || !isEmptySlot(currentSlots[targetSlotIndex + i])) {
                canFit = false;
                break;
              }
            }

            if (canFit) {
              for (let i = 0; i < slotsNeeded; i++) {
                currentSlots[targetSlotIndex + i] = equipmentInternalId || equipmentName;
              }
              placementSuccessful = true;
              return { ...loc, slots: currentSlots };
            } else {
              alert(`Cannot fit ${equipmentName} (${slotsNeeded} slots) at ${targetLocation} slot ${targetSlotIndex + 1}. Not enough empty contiguous slots or out of bounds.`);
              return loc;
            }
          }
          return loc;
        });

        if (placementSuccessful) {
          setCustomizedCriticals(newCriticalsState);
          setCustomizedLoadout(prevLoadout => [
            ...prevLoadout,
            {
              item_name: equipmentInternalId || equipmentName,
              item_type: equipmentType,
              location: targetLocation,
            }
          ]);
          setSelectedEquipmentForAdding(null);
          setTargetLocation(null);
          setTargetSlotIndex(null);
        }
      };

      const handleRemoveEquipment = () => {
        if (!equipmentToRemove) return;

        const { name, location, startIndex, count } = equipmentToRemove;

        // Update criticals
        setCustomizedCriticals(prevCriticals =>
          prevCriticals.map(loc => {
            if (loc.location === location) {
              const newSlots = [...loc.slots];
              for (let i = 0; i < count; i++) {
                if (startIndex + i < newSlots.length) { // Boundary check
                  newSlots[startIndex + i] = "-Empty-"; // Or your preferred empty slot marker
                }
              }
              return { ...loc, slots: newSlots };
            }
            return loc;
          })
        );

        // Update loadout: Remove the first occurrence of this item in this location
        setCustomizedLoadout(prevLoadout => {
          const itemIndexToRemove = prevLoadout.findIndex(
            item => item.item_name === name && item.location === location
          );
          if (itemIndexToRemove !== -1) {
            const newLoadout = [...prevLoadout];
            newLoadout.splice(itemIndexToRemove, 1);
            return newLoadout;
          }
          return prevLoadout; // Should not happen if criticals were consistent
        });

        setEquipmentToRemove(null); // Clear selection
      };

      const handleSaveVariant = async () => {
        if (!selectedUnit) {
          setSaveStatus("Error: No unit selected to customize and save.");
          return;
        }
        if (!variantName.trim()) {
          setSaveStatus("Error: Please enter a name for your custom variant.");
          return;
        }

        setIsSaving(true);
        setSaveStatus("Saving variant...");

        const customDataPayload = {
          loadout: customizedLoadout,
          criticals: customizedCriticals,
          // Include any other aspects of customization if they are tracked in state,
          // e.g., armor changes, engine changes, etc. For now, it's loadout & crits.
        };

        try {
          const response = await fetch('/api/custom-variants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              baseUnitId: selectedUnit.id,
              variantName: variantName.trim(),
              notes: variantNotes.trim(), // Send notes if the field is used
              customData: customDataPayload,
            }),
          });

          const result = await response.json();

          if (response.ok) {
            setSaveStatus(`Success! Variant '${variantName.trim()}' saved with ID: ${result.variantId}`);
            setVariantName(""); // Clear name for next save
            setVariantNotes(""); // Clear notes
          } else {
            setSaveStatus(`Error: ${result.message || 'Failed to save variant.'} (${response.status})`);
          }
        } catch (error) {
          console.error("Save variant error:", error);
          setSaveStatus(`Error: An unexpected error occurred while saving. ${error instanceof Error ? error.message : ''}`);
        } finally {
          setIsSaving(false);
        }
      };

      const runValidations = (currentLoadout: UnitEquipmentItem[], currentUnit: CustomizableUnit | null, allEquipment: EquipmentItem[]) => {
        if (!currentUnit) return;

        const newWarnings: string[] = [];

        // 1. Weight Validation (Equipment Only)
        let currentEquipmentTonnage = 0;
        currentLoadout.forEach(loadoutItem => {
          const equipmentDetails = allEquipment.find(
            eq => eq.internal_id === loadoutItem.item_name || eq.name === loadoutItem.item_name
          );
          if (equipmentDetails) {
            currentEquipmentTonnage += equipmentDetails.tonnage;
          }
        });

        const maxTonnage = currentUnit.mass;
        if (currentEquipmentTonnage > maxTonnage) {
          newWarnings.push(`Warning: Unit overweight by ${(currentEquipmentTonnage - maxTonnage).toFixed(2)} tons (equipment loadout only). Max: ${maxTonnage} tons.`);
        } else {
          newWarnings.push(`Info: Current equipment loadout tonnage: ${currentEquipmentTonnage.toFixed(2)} / ${maxTonnage} tons. (Note: Does not include fixed internal components like engine, structure, cockpit, gyro, etc.)`);
        }

        // 2. Critical Slot Validation (Basic Check)
        customizedCriticals.forEach(loc => {
            const occupiedSlots = loc.slots.filter(s => !isEmptySlot(s)).length;
            if (occupiedSlots > loc.slots.length) {
                newWarnings.push(`Warning: Location ${loc.location} has ${occupiedSlots} items, exceeding defined slot capacity of ${loc.slots.length}.`)
            }
        });

        setValidationWarnings(newWarnings);
      };

      useEffect(() => {
        const fetchUnit = async () => {
          if (!HARDCODED_UNIT_ID) {
            setError("No unit ID specified.");
            setIsLoadingUnit(false);
            return;
          }
          // Ensure this runs only once or when HARDCODED_UNIT_ID changes, though it's constant here
          // No explicit dependency needed if HARDCODED_UNIT_ID is truly constant for the page's lifetime
        };
        // Call fetchUnit directly or manage its invocation carefully if it were to change
        // For now, let's ensure it's called on mount

        (async () => {
            setIsLoadingUnit(true);
            setError(null);
            try {
                const response = await fetch(`/api/units?id=${HARDCODED_UNIT_ID}`);
                if (!response.ok) {
                throw new Error(`Failed to fetch unit ${HARDCODED_UNIT_ID}: ${response.status} ${response.statusText}`);
                }
                const unitData: CustomizableUnit = await response.json();
                if (!unitData || !unitData.data) {
                    throw new Error(`Fetched unit data or unit.data for ID ${HARDCODED_UNIT_ID} is missing or malformed.`);
                }
                setSelectedUnit(unitData);
                setCustomizedLoadout(unitData.data.weapons_and_equipment || []);
                setCustomizedCriticals(unitData.data.criticals || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setSelectedUnit(null); // Clear unit on error
            } finally {
                setIsLoadingUnit(false);
            }
        })();

      }, []); // Empty dependency array means this effect runs once on mount

      useEffect(() => {
        // Similar structure for fetching equipment
        (async () => {
            setIsLoadingEquipment(true);
            try {
                const response = await fetch(`/api/equipment?limit=500`);
                if (!response.ok) {
                throw new Error(`Failed to fetch equipment: ${response.status} ${response.statusText}`);
                }
                const equipmentData: ApiListResponse<EquipmentItem> = await response.json();
                setAvailableEquipment(equipmentData.items || []);
            } catch (err) {
                setError(prevError => prevError ? `${prevError}; ${err instanceof Error ? err.message : String(err)}` : (err instanceof Error ? err.message : String(err)) );
            } finally {
                setIsLoadingEquipment(false);
            }
        })();
      }, []); // Empty dependency array for equipment fetch too

      useEffect(() => {
        if (selectedUnit && availableEquipment.length > 0) { // Ensure selectedUnit and availableEquipment are loaded
          runValidations(customizedLoadout, selectedUnit, availableEquipment);
        }
      }, [customizedLoadout, selectedUnit, availableEquipment]);


      if (isLoadingUnit || isLoadingEquipment) {
        return <Layout><div className="container mx-auto p-4">Loading customizer data...</div></Layout>;
      }

      if (error && !selectedUnit && !isLoadingUnit) {
        return <Layout><div className="container mx-auto p-4 text-red-500">Error loading unit data: {error}. Please ensure ID ('${HARDCODED_UNIT_ID}') is a valid unit with expected data structure.</div></Layout>;
      }

      if (!selectedUnit && !isLoadingUnit) {
         return <Layout><div className="container mx-auto p-4">No unit data loaded. This might be due to an invalid ID ('${HARDCODED_UNIT_ID}') or unexpected data structure.</div></Layout>;
      }

      if (!selectedUnit) {
          return <Layout><div className="container mx-auto p-4">Waiting for unit data...</div></Layout>;
      }

      return (
        <Layout>
          <div className="container mx-auto p-4">
            {error && !isLoadingEquipment && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">Error during data fetching: {error}</div>}
            <h1 className="text-2xl font-bold mb-4">Unit Customizer: {selectedUnit.chassis} {selectedUnit.model}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <UnitDisplayPanel selectedUnit={selectedUnit} customizedLoadout={customizedLoadout} availableEquipment={availableEquipment} />
                <CriticalsPanel
                  unitType={selectedUnit.data?.type || selectedUnit.type}
                  unitConfig={selectedUnit.data?.config}
                  customizedCriticals={customizedCriticals}
                  onSelectSlot={handleSelectSlot}
                  targetLocation={targetLocation}
                  targetSlotIndex={targetSlotIndex}
                  equipmentToRemoveDetails={equipmentToRemove}
                />
              </div>
              <div>
                <EquipmentPickerPanel
                  availableEquipment={availableEquipment}
                  onSelectEquipment={handleSelectEquipment}
                  selectedEquipmentId={selectedEquipmentForAdding?.id || selectedEquipmentForAdding?.internal_id}
                />
              </div>
            </div>
            {selectedEquipmentForAdding && targetLocation !== null && targetSlotIndex !== null && (
              <div className="mt-4 p-2 text-center">
                <button
                  onClick={handleAddEquipment}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Add "{selectedEquipmentForAdding.name}" to {targetLocation} [Slot {targetSlotIndex + 1}]
                </button>
              </div>
            )}
            {equipmentToRemove && (
              <div className="mt-4 p-2 text-center">
                <button
                  onClick={handleRemoveEquipment}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Remove "{equipmentToRemove.name}" from {equipmentToRemove.location}
                </button>
              </div>
            )}
            <ValidationMessagesPanel warnings={validationWarnings} />

            {/* Save Variant Section */}
            <div className="mt-6 p-4 border rounded shadow-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">Save Custom Variant</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="variantName" className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="variantName"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Enter a name for your variant (e.g., My Custom Atlas)"
                    className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label htmlFor="variantNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="variantNotes"
                    value={variantNotes}
                    onChange={(e) => setVariantNotes(e.target.value)}
                    placeholder="Any notes about this custom configuration..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                  />
                </div>
                <button
                  onClick={handleSaveVariant}
                  disabled={isSaving || !variantName.trim() || !selectedUnit}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save As New Variant'}
                </button>
              </div>
              {saveStatus && (
                <div className={`mt-3 p-2 text-sm rounded ${saveStatus.toLowerCase().startsWith('error:') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {saveStatus}
                </div>
              )}
            </div>
          </div>
        </Layout>
      );
    };
    export default CustomizerPage;
