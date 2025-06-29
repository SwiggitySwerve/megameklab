/**
 * Browser Persistence Verification Script
 * 
 * This script can be run in the browser console to manually verify
 * that unit configurations persist properly across page refreshes.
 * 
 * Instructions:
 * 1. Open the BattleTech Editor in your browser
 * 2. Open browser developer tools (F12)
 * 3. Go to Console tab
 * 4. Paste and run this script
 * 5. Follow the logged instructions
 */

console.log('🧪 BattleTech Editor - Browser Persistence Verification');
console.log('This script will help verify that configurations persist across page refreshes.\n');

// Function to check current localStorage state
function checkCurrentState() {
    console.log('📊 Current localStorage State:');
    
    // Check for complete state entries
    const completeStateKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('battletech-complete-state-')
    );
    
    console.log(`Found ${completeStateKeys.length} complete state entries:`);
    completeStateKeys.forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            const config = data.completeState?.configuration || data.config;
            console.log(`  - ${key}:`, {
                version: data.version,
                engineType: config?.engineType,
                gyroType: config?.gyroType,
                structureType: config?.structureType,
                armorType: config?.armorType,
                enhancementType: config?.enhancementType,
                unallocatedEquipment: data.completeState?.unallocatedEquipment?.length || 0
            });
        } catch (error) {
            console.warn(`  - ${key}: Invalid JSON`);
        }
    });
    
    console.log('');
}

// Function to create test configuration and save it
function createTestConfiguration() {
    console.log('🔧 Creating Test Configuration...');
    
    const testConfig = {
        chassis: 'Persistence Test',
        model: 'TEST-1',
        tonnage: 50,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        engineRating: 200,
        runMP: 6,
        engineType: 'XL',                    // Changed from Standard
        gyroType: 'Compact',                 // Changed from Standard  
        structureType: 'Endo Steel',         // Changed from Standard
        armorType: 'Ferro-Fibrous',          // Changed from Standard
        enhancementType: 'MASC',             // Changed from null
        heatSinkType: 'Double',              // Changed from Single
        totalHeatSinks: 15,                  // Changed from 10
        externalHeatSinks: 5,                // Changed from 2
        jumpMP: 3,                           // Changed from 0
        jumpJetType: 'Standard Jump Jet',
        armorAllocation: {
            HD: { front: 9, rear: 0 },
            CT: { front: 30, rear: 10 },
            LT: { front: 24, rear: 8 },
            RT: { front: 24, rear: 8 },
            LA: { front: 20, rear: 0 },
            RA: { front: 20, rear: 0 },
            LL: { front: 30, rear: 0 },
            RL: { front: 30, rear: 0 }
        },
        armorTonnage: 8.0,
        jumpJetCounts: {},
        hasPartialWing: false,
        mass: 50
    };
    
    // Create mock complete state
    const completeState = {
        version: '1.0.0',
        configuration: testConfig,
        criticalSlotAllocations: {},
        unallocatedEquipment: [
            // Mock Endo Steel components (14)
            ...Array.from({ length: 14 }, (_, i) => ({
                equipmentData: {
                    id: `endo_steel_piece_${i + 1}`,
                    name: 'Endo Steel',
                    type: 'equipment',
                    requiredSlots: 1,
                    weight: 0,
                    techBase: 'Inner Sphere',
                    componentType: 'structure'
                },
                equipmentGroupId: `endo_steel_piece_${i + 1}_group_test`,
                location: '',
                startSlotIndex: -1,
                endSlotIndex: -1,
                occupiedSlots: []
            })),
            // Mock Ferro-Fibrous components (14)
            ...Array.from({ length: 14 }, (_, i) => ({
                equipmentData: {
                    id: `ferro_fibrous_piece_${i + 1}`,
                    name: 'Ferro-Fibrous',
                    type: 'equipment',
                    requiredSlots: 1,
                    weight: 0,
                    techBase: 'Inner Sphere',
                    componentType: 'armor'
                },
                equipmentGroupId: `ferro_fibrous_piece_${i + 1}_group_test`,
                location: '',
                startSlotIndex: -1,
                endSlotIndex: -1,
                occupiedSlots: []
            })),
            // Mock Heat Sinks (5)
            ...Array.from({ length: 5 }, (_, i) => ({
                equipmentData: {
                    id: `double_external_${i + 1}`,
                    name: 'Double Heat Sink',
                    type: 'heat_sink',
                    requiredSlots: 3,
                    weight: 1,
                    techBase: 'Inner Sphere',
                    heat: -2
                },
                equipmentGroupId: `double_external_${i + 1}_group_test`,
                location: '',
                startSlotIndex: -1,
                endSlotIndex: -1,
                occupiedSlots: []
            })),
            // Mock Jump Jets (3)
            ...Array.from({ length: 3 }, (_, i) => ({
                equipmentData: {
                    id: `standard_jump_jet_${i + 1}`,
                    name: 'Standard Jump Jet',
                    type: 'equipment',
                    requiredSlots: 1,
                    weight: 0.5,
                    techBase: 'Inner Sphere',
                    heat: 3
                },
                equipmentGroupId: `standard_jump_jet_${i + 1}_group_test`,
                location: '',
                startSlotIndex: -1,
                endSlotIndex: -1,
                occupiedSlots: []
            }))
        ],
        timestamp: Date.now()
    };
    
    // Save to localStorage using the same format as the app
    const tabData = {
        completeState,
        config: testConfig,
        modified: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const storageKey = 'battletech-complete-state-persistence-test';
    localStorage.setItem(storageKey, JSON.stringify(tabData));
    
    console.log('✅ Test configuration saved to localStorage');
    console.log(`📝 Configuration summary:`, {
        engineType: testConfig.engineType,
        gyroType: testConfig.gyroType,
        structureType: testConfig.structureType,
        armorType: testConfig.armorType,
        enhancementType: testConfig.enhancementType,
        specialComponents: completeState.unallocatedEquipment.length
    });
    
    return storageKey;
}

// Function to verify configuration after refresh
function verifyAfterRefresh(expectedStorageKey) {
    console.log('🔍 Verifying Configuration After Refresh...');
    
    const data = localStorage.getItem(expectedStorageKey);
    if (!data) {
        console.error('❌ FAILED: Test configuration not found in localStorage');
        return false;
    }
    
    try {
        const tabData = JSON.parse(data);
        const config = tabData.completeState?.configuration || tabData.config;
        const unallocatedEquipment = tabData.completeState?.unallocatedEquipment || [];
        
        console.log('✅ Configuration found and parsed successfully');
        console.log('📊 Restored configuration:', {
            engineType: config.engineType,
            gyroType: config.gyroType,
            structureType: config.structureType,
            armorType: config.armorType,
            enhancementType: config.enhancementType,
            specialComponents: unallocatedEquipment.length
        });
        
        // Verify expected values
        const expectedValues = {
            engineType: 'XL',
            gyroType: 'Compact',
            structureType: 'Endo Steel',
            armorType: 'Ferro-Fibrous',
            enhancementType: 'MASC'
        };
        
        let allMatch = true;
        Object.entries(expectedValues).forEach(([key, expectedValue]) => {
            if (config[key] !== expectedValue) {
                console.error(`❌ MISMATCH: ${key} = ${config[key]}, expected ${expectedValue}`);
                allMatch = false;
            } else {
                console.log(`✅ MATCH: ${key} = ${config[key]}`);
            }
        });
        
        // Verify special components
        const expectedComponentCount = 36; // 14 Endo Steel + 14 Ferro-Fibrous + 5 Heat Sinks + 3 Jump Jets
        if (unallocatedEquipment.length === expectedComponentCount) {
            console.log(`✅ MATCH: Special components = ${unallocatedEquipment.length}`);
        } else {
            console.error(`❌ MISMATCH: Special components = ${unallocatedEquipment.length}, expected ${expectedComponentCount}`);
            allMatch = false;
        }
        
        if (allMatch) {
            console.log('🎉 SUCCESS: All configuration values persisted correctly!');
        } else {
            console.log('💥 FAILURE: Some configuration values did not persist correctly.');
        }
        
        return allMatch;
        
    } catch (error) {
        console.error('❌ FAILED: Error parsing configuration data:', error);
        return false;
    }
}

// Main verification workflow
function runPersistenceTest() {
    console.log('🚀 Starting Browser Persistence Test...\n');
    
    // Step 1: Check current state
    checkCurrentState();
    
    // Step 2: Create test configuration
    const testKey = createTestConfiguration();
    
    // Step 3: Instructions for user
    console.log('\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('1. ✅ Test configuration has been saved to localStorage');
    console.log('2. 🔄 Now REFRESH this page (F5 or Ctrl+R)');
    console.log('3. 📱 Open developer tools again and run: verifyPersistenceTest()');
    console.log('4. 📊 Check the results to see if persistence worked\n');
    
    // Make verification function available globally
    window.verifyPersistenceTest = () => verifyAfterRefresh(testKey);
    
    console.log('💡 TIP: You can also run checkCurrentState() anytime to see localStorage contents');
    window.checkCurrentState = checkCurrentState;
}

// Auto-start the test
runPersistenceTest();
