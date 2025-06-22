import megamek.common.*;
import megamek.common.weapons.infantry.InfantryWeapon;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

/**
 * Extracts equipment data including page references from MegaMek engine
 * Outputs JSON data for populating TypeScript equipment files
 */
public class ExtractEquipmentReferences {
    
    static class EquipmentData {
        String id;
        String name;
        String category;
        String baseType;
        String description;
        boolean requiresAmmo;
        int introductionYear;
        String rulesLevel;
        String sourceBook;
        String pageReference;
        Map<String, VariantData> variants = new HashMap<>();
        List<String> special;
        
        static class VariantData {
            double weight;
            int crits;
            Integer damage;
            Integer heat;
            Integer minRange;
            Integer rangeShort;
            Integer rangeMedium;
            Integer rangeLong;
            Integer rangeExtreme;
            Integer ammoPerTon;
            Integer cost;
            Integer battleValue;
        }
    }
    
    public static void main(String[] args) {
        System.out.println("Initializing MegaMek equipment types...");
        
        try {
            // Initialize MegaMek equipment database
            EquipmentType.initializeTypes();
            
            List<EquipmentData> allEquipment = new ArrayList<>();
            
            // Extract all equipment types
            Enumeration<EquipmentType> equipmentTypes = EquipmentType.getAllTypes();
            while (equipmentTypes.hasMoreElements()) {
                EquipmentType equipmentType = equipmentTypes.nextElement();
                
                try {
                    EquipmentData data = extractEquipmentData(equipmentType);
                    if (data != null) {
                        allEquipment.add(data);
                    }
                } catch (Exception e) {
                    System.err.println("Error processing equipment: " + equipmentType.getName() + " - " + e.getMessage());
                }
            }
            
            // Sort by name for consistency
            allEquipment.sort(Comparator.comparing(e -> e.name));
            
            // Output to JSON file
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            
            try (FileWriter writer = new FileWriter("equipment_references.json")) {
                gson.toJson(allEquipment, writer);
                System.out.println("Successfully exported " + allEquipment.size() + " equipment items to equipment_references.json");
            }
            
            // Also create a summary of source books found
            Set<String> sourceBooks = new HashSet<>();
            for (EquipmentData eq : allEquipment) {
                if (eq.sourceBook != null && !eq.sourceBook.trim().isEmpty()) {
                    sourceBooks.add(eq.sourceBook);
                }
            }
            
            System.out.println("\nSource books found:");
            sourceBooks.stream().sorted().forEach(System.out::println);
            
        } catch (Exception e) {
            System.err.println("Failed to extract equipment data: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static EquipmentData extractEquipmentData(EquipmentType equipmentType) {
        EquipmentData data = new EquipmentData();
        
        // Basic information
        data.id = generateId(equipmentType.getName());
        data.name = equipmentType.getName();
        data.category = determineCategory(equipmentType);
        data.baseType = equipmentType.getName();
        data.description = equipmentType.getDesc();
        data.requiresAmmo = equipmentType instanceof AmmoWeapon;
        
        // Tech advancement info
        if (equipmentType.getTechAdvancement() != null) {
            data.introductionYear = equipmentType.getTechAdvancement().getIntroductionDate();
            data.rulesLevel = equipmentType.getStaticTechLevel().toString();
        } else {
            data.introductionYear = 2750; // Default
            data.rulesLevel = "Standard";
        }
        
        // Parse rules references
        String rulesRefs = equipmentType.getRulesRefs();
        parseRulesReference(rulesRefs, data);
        
        // Extract variant data for IS and Clan
        extractVariantData(equipmentType, data, true);  // IS
        extractVariantData(equipmentType, data, false); // Clan
        
        // Special rules
        if (equipmentType instanceof WeaponType) {
            data.special = extractWeaponSpecialRules((WeaponType) equipmentType);
        }
        
        return data;
    }
    
    private static void parseRulesReference(String rulesRefs, EquipmentData data) {
        if (rulesRefs != null && !rulesRefs.trim().isEmpty()) {
            // Expected format: "208, TM" or just "TM"
            String[] parts = rulesRefs.split(",");
            if (parts.length >= 2) {
                data.pageReference = parts[0].trim();
                data.sourceBook = parts[1].trim();
            } else {
                data.sourceBook = parts[0].trim();
            }
        }
    }
    
    private static void extractVariantData(EquipmentType equipmentType, EquipmentData data, boolean isIS) {
        // Create a mock entity to get proper values
        Mek mockEntity = new BipedMek();
        mockEntity.setClan(!isIS);
        
        EquipmentData.VariantData variant = new EquipmentData.VariantData();
        
        try {
            variant.weight = equipmentType.getTonnage(mockEntity);
            variant.crits = equipmentType.getCriticals(mockEntity);
            
            if (equipmentType instanceof WeaponType) {
                WeaponType weapon = (WeaponType) equipmentType;
                variant.damage = weapon.getDamage();
                variant.heat = weapon.getHeat();
                variant.minRange = weapon.getMinimumRange();
                variant.rangeShort = weapon.getShortRange();
                variant.rangeMedium = weapon.getMediumRange();
                variant.rangeLong = weapon.getLongRange();
                variant.rangeExtreme = weapon.getExtremeRange();
                variant.battleValue = (int) weapon.getBV(mockEntity);
                variant.cost = (int) weapon.getCost(mockEntity, false, Entity.LOC_NONE);
            }
            
            if (equipmentType instanceof AmmoType) {
                AmmoType ammo = (AmmoType) equipmentType;
                variant.ammoPerTon = ammo.getShots();
            }
            
            // Only add variant if it has valid data
            if (variant.weight > 0 || variant.crits > 0) {
                String techBase = isIS ? "IS" : "Clan";
                
                // Check if this tech base is actually available for this equipment
                if (equipmentType.getTechBase() == TechConstants.T_ALL ||
                    (isIS && (equipmentType.getTechBase() == TechConstants.T_IS)) ||
                    (!isIS && (equipmentType.getTechBase() == TechConstants.T_CLAN))) {
                    data.variants.put(techBase, variant);
                }
            }
        } catch (Exception e) {
            // Skip this variant if there's an error
            System.err.println("Error extracting variant for " + equipmentType.getName() + " (" + (isIS ? "IS" : "Clan") + "): " + e.getMessage());
        }
    }
    
    private static List<String> extractWeaponSpecialRules(WeaponType weapon) {
        List<String> special = new ArrayList<>();
        
        if (weapon.hasFlag(WeaponType.F_PULSE)) special.add("Pulse");
        if (weapon.hasFlag(WeaponType.F_ONESHOT)) special.add("One-Shot");
        if (weapon.hasFlag(WeaponType.F_STREAK)) special.add("Streak");
        if (weapon.hasFlag(WeaponType.F_ARTEMIS_COMPATIBLE)) special.add("Artemis Compatible");
        if (weapon.hasFlag(WeaponType.F_AMS)) special.add("Anti-Missile System");
        
        return special.isEmpty() ? null : special;
    }
    
    private static String determineCategory(EquipmentType equipmentType) {
        if (equipmentType instanceof WeaponType) {
            WeaponType weapon = (WeaponType) equipmentType;
            
            if (weapon.hasFlag(WeaponType.F_ENERGY)) return "Energy Weapons";
            if (weapon.hasFlag(WeaponType.F_BALLISTIC)) return "Ballistic Weapons";
            if (weapon.hasFlag(WeaponType.F_MISSILE)) return "Missile Weapons";
            if (weapon.hasFlag(WeaponType.F_ARTILLERY)) return "Artillery Weapons";
            if (weapon.isCapital()) return "Capital Weapons";
            if (weapon instanceof InfantryWeapon) return "Anti-Personnel Weapons";
            if (weapon.hasFlag(WeaponType.F_ONESHOT)) return "One-Shot Weapons";
            
            return "Physical Weapons";
        } else if (equipmentType instanceof AmmoType) {
            return "Ammunition";
        } else if (equipmentType instanceof MiscType) {
            MiscType misc = (MiscType) equipmentType;
            
            if (misc.hasFlag(MiscType.F_HEAT_SINK)) return "Heat Management";
            if (misc.hasFlag(MiscType.F_JUMP_JET)) return "Movement Equipment";
            if (misc.hasFlag(MiscType.F_ECM) || misc.hasFlag(MiscType.F_BAP)) return "Electronic Warfare";
            if (misc.hasFlag(MiscType.F_PROTOTYPE)) return "Prototype Equipment";
            if (misc.hasFlag(MiscType.F_INDUSTRIAL)) return "Industrial Equipment";
            
            return "Equipment";
        }
        
        return "Equipment";
    }
    
    private static String generateId(String name) {
        return name.toLowerCase()
                   .replaceAll("[^a-z0-9]+", "_")
                   .replaceAll("^_+|_+$", "");
    }
}
