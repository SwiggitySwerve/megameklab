/**
 * Equipment Browser Services Demonstration
 * Shows the new SOLID-compliant equipment browser services in action
 */

import { getEquipmentBrowserController } from './utils/equipment/EquipmentBrowserController';

async function demonstrateEquipmentBrowserServices() {
  console.log('🔧 Equipment Browser Services Demonstration');
  console.log('============================================\n');

  try {
    // Get the equipment browser controller
    const controller = getEquipmentBrowserController();
    console.log('📊 Initializing Equipment Browser Controller...');
    
    // Initialize the controller (loads all equipment data)
    await controller.initialize();
    console.log('✅ Controller initialized successfully\n');

    // Check if controller is ready
    console.log(`📋 Controller Ready: ${controller.isReady()}`);
    
    // Get initial equipment listing (default: all equipment, sorted by name, page 1)
    console.log('📦 Getting initial equipment listing...');
    const initialResult = await controller.getEquipment();
    console.log(`📊 Initial Results: ${initialResult.equipment.items.length} items on page ${initialResult.equipment.currentPage}/${initialResult.equipment.totalPages}`);
    console.log(`📈 Total Equipment: ${initialResult.equipment.totalItems} variants`);
    console.log(`📂 Categories: ${initialResult.categories.length} (${initialResult.categories.slice(0, 5).join(', ')}...)`);
    console.log(`🏭 Tech Bases: ${initialResult.techBases.join(', ')}\n`);

    // Show sample equipment
    console.log('🔍 Sample Equipment (first 5):');
    initialResult.equipment.items.slice(0, 5).forEach((equipment, index) => {
      console.log(`  ${index + 1}. ${equipment.name} (${equipment.techBase}) - ${equipment.weight}t, ${equipment.crits} slots`);
    });
    console.log();

    // Demonstrate filtering
    console.log('🔎 Applying Search Filter: "laser"...');
    const searchResult = await controller.setFilters({ searchTerm: 'laser' });
    console.log(`📊 Search Results: ${searchResult.equipment.items.length} items found`);
    
    // Show first few laser results
    console.log('🔍 Sample Laser Equipment:');
    searchResult.equipment.items.slice(0, 3).forEach((equipment, index) => {
      console.log(`  ${index + 1}. ${equipment.name} (${equipment.techBase}) - Damage: ${equipment.damage || 'N/A'}, Heat: ${equipment.heat || 'N/A'}`);
    });
    console.log();

    // Demonstrate category filtering
    console.log('🏷️ Applying Category Filter: "Energy Weapons"...');
    const categoryResult = await controller.setFilters({ 
      searchTerm: '', 
      category: 'Energy Weapons' 
    });
    console.log(`📊 Category Results: ${categoryResult.equipment.items.length} energy weapons`);
    console.log();

    // Demonstrate tech base filtering
    console.log('🏭 Applying Tech Base Filter: "Clan"...');
    const techBaseResult = await controller.setFilters({ 
      category: 'Energy Weapons',
      techBase: 'Clan'
    });
    console.log(`📊 Clan Energy Weapons: ${techBaseResult.equipment.items.length} items`);
    console.log();

    // Demonstrate sorting
    console.log('📈 Changing Sort: Weight (High to Low)...');
    const sortResult = await controller.setSort({ 
      sortBy: 'weight', 
      sortOrder: 'DESC' 
    });
    console.log(`📊 Sorted Results: Heaviest equipment first`);
    
    // Show heaviest equipment
    console.log('🔍 Heaviest Clan Energy Weapons:');
    sortResult.equipment.items.slice(0, 3).forEach((equipment, index) => {
      console.log(`  ${index + 1}. ${equipment.name} - ${equipment.weight}t, ${equipment.crits} slots`);
    });
    console.log();

    // Demonstrate pagination
    console.log('📄 Changing Page Size to 10...');
    const paginationResult = await controller.setPagination({ pageSize: 10 });
    console.log(`📊 Pagination: ${paginationResult.equipment.items.length} items per page, ${paginationResult.equipment.totalPages} total pages`);
    console.log();

    // Demonstrate equipment conversion
    console.log('🔄 Converting Equipment for Allocation...');
    const firstEquipment = paginationResult.equipment.items[0];
    if (firstEquipment) {
      const equipmentObject = controller.convertToEquipmentObject(firstEquipment);
      console.log(`📦 Converted: ${firstEquipment.name}`);
      console.log(`   Original: EquipmentVariant with ${Object.keys(firstEquipment).length} properties`);
      console.log(`   Converted: EquipmentObject with slots=${equipmentObject.requiredSlots}, weight=${equipmentObject.weight}t`);
      console.log();
    }

    // Demonstrate filter statistics
    console.log('📊 Getting Filter Statistics...');
    const stats = await controller.getFilterStats();
    console.log(`📈 Filter Stats:`);
    console.log(`   Total Items: ${stats.totalItems}`);
    console.log(`   Filtered Items: ${stats.filteredItems} (${stats.filterPercentage.toFixed(1)}%)`);
    console.log(`   Category Breakdown:`, Object.entries(stats.categoryCounts).slice(0, 3));
    console.log(`   Tech Base Breakdown:`, stats.techBaseCounts);
    console.log();

    // Demonstrate suggestions
    console.log('💡 Getting Filter Suggestions for "ppc"...');
    const suggestions = controller.getFilterSuggestions('ppc', 5);
    console.log(`📝 Suggestions:`);
    console.log(`   Names: ${suggestions.names.slice(0, 3).join(', ')}`);
    console.log(`   Categories: ${suggestions.categories.join(', ')}`);
    console.log(`   Tech Bases: ${suggestions.techBases.join(', ')}`);
    console.log();

    // Demonstrate reset
    console.log('🔄 Resetting All Filters...');
    const resetResult = await controller.resetFilters();
    console.log(`📊 Reset Complete: Back to ${resetResult.equipment.items.length} items on page 1`);
    console.log();

    // Show service access
    console.log('🔧 Accessing Individual Services...');
    const dataService = controller.getDataService();
    const filterService = controller.getFilterService();
    const sortService = controller.getSortService();
    const paginationService = controller.getPaginationService();
    
    console.log(`📊 Services Available:`);
    console.log(`   Data Service: ${dataService.isReady() ? 'Ready' : 'Not Ready'}`);
    console.log(`   Filter Service: Available`);
    console.log(`   Sort Service: Available`);
    console.log(`   Pagination Service: Available`);
    console.log();

    // Test individual service
    console.log('🧪 Testing Individual Filter Service...');
    const allEquipment = await dataService.loadAllEquipment();
    const ppcs = filterService.applySearch(allEquipment, 'ppc');
    console.log(`🔍 Direct filter test: Found ${ppcs.length} PPC variants`);
    console.log();

    console.log('✅ Equipment Browser Services Demonstration Complete!');
    console.log('🎯 All services working correctly with SOLID architecture');

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
  }
}

// Run the demonstration
demonstrateEquipmentBrowserServices();
