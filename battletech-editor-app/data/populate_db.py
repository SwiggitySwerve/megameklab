import os
import json
import sqlite3 # Changed from psycopg2
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

# --- Database File ---
SQLITE_DB_FILE = SCRIPT_DIR / "battletech_dev.sqlite" # New SQLite DB file

BASE_INPUT_DIR = SCRIPT_DIR / "megameklab_converted_output"
MEKFILES_INPUT_DIR = BASE_INPUT_DIR / "mekfiles"

def get_db_connection():
    conn = None
    try:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        print(f"Successfully connected to SQLite database: {SQLITE_DB_FILE}")
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to SQLite database {SQLITE_DB_FILE}: {e}")
        raise # Re-raise SQLite errors
    except Exception as ex:
        print(f"An unexpected error occurred during DB connection: {ex}")
        raise

def create_schema(conn):
    """Creates database schema from schema_sqlite.sql if it doesn't exist."""
    try:
        schema_path = SCRIPT_DIR / "schema_sqlite.sql" # Assuming it's in the same directory
        if not os.path.exists(schema_path):
            print(f"FATAL: Schema file not found: {schema_path}")
            return False

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        cur = conn.cursor()
        cur.executescript(schema_sql)
        conn.commit() # Commit schema changes
        print("SQLite schema created/verified successfully.")
        return True
    except sqlite3.Error as e:
        print(f"Error creating SQLite schema: {e}")
        conn.rollback() # Rollback in case of error during schema creation
        return False
    except Exception as ex:
        print(f"An unexpected error occurred during schema creation: {ex}")
        conn.rollback()
        return False

def populate_equipment(conn):
    filepath = MEKFILES_INPUT_DIR / "derivedEquipment.json"
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return 0

    with open(filepath, 'r', encoding='utf-8') as f:
        equipment_list = json.load(f)

    equipment_to_insert = []
    # SQLite uses ? for placeholders. ON CONFLICT requires an indexed column.
    # Assuming internal_id is unique and indexed for conflict resolution.
    sql = """
    INSERT OR REPLACE INTO equipment
        (internal_id, name, type, category, tech_base, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """
    # Note: For created_at with INSERT OR REPLACE, it will always be the time of the last operation.
    # If strict "created_at only on first insert" is needed, a different approach is required.

    cur = conn.cursor()
    for item in equipment_list:
        try:
            internal_id = item.get('internal_id')
            name = item.get('name')
            item_type = item.get('type', 'Unknown')
            category = item.get('category', 'Unknown')
            tech_base = item.get('tech_base', '')
            
            # Derive tech_base from naming patterns if not specified
            if not tech_base or tech_base == 'Unknown':
                item_name_lower = (item.get('name', '') or internal_id or '').lower()
                
                # Clan tech patterns
                if (item_name_lower.startswith('cl') or 
                    item_name_lower.startswith('clan') or
                    'clan' in item_name_lower or
                    item_name_lower.startswith('c ') or
                    'streak' in item_name_lower or
                    ('er ' in item_name_lower and ('laser' in item_name_lower or 'ppc' in item_name_lower)) or
                    'ultra' in item_name_lower):
                    tech_base = 'Clan'
                
                # Inner Sphere tech patterns  
                elif (item_name_lower.startswith('is') or
                      'inner sphere' in item_name_lower or
                      'autocannon' in item_name_lower or
                      'standard' in item_name_lower or
                      'lrm' in item_name_lower or
                      'srm' in item_name_lower or
                      'machine gun' in item_name_lower):
                    tech_base = 'IS'
                
                # Default fallback based on more patterns
                elif any(clan_indicator in item_name_lower for clan_indicator in [
                    'gauss', 'pulse', 'lbx', 'artemis', 'narc', 'tag'
                ]):
                    tech_base = 'Clan'
                else:
                    tech_base = 'IS'  # Default to IS for unknown items

            # Debug: Check for invalid tech_base values
            if tech_base not in ['IS', 'Clan', 'Mixed']:
                print(f"Invalid tech_base '{tech_base}' for item: {item.get('name', 'Unnamed')} (internal_id: {internal_id})")
                tech_base = 'IS'  # Force to valid value

            if not internal_id or not name:
                print(f"Skipping equipment item due to missing internal_id or name: {item.get('name', 'Unnamed')}")
                continue

            equipment_to_insert.append((
                internal_id, name, item_type, category,
                tech_base, json.dumps(item) # Store full JSON data as TEXT
            ))
        except Exception as ex: # Broad exception for data prep
            print(f"Error preparing equipment data for {item.get('internal_id', 'N/A')}: {ex}")

    inserted_updated_count = 0
    if equipment_to_insert:
        try:
            cur.executemany(sql, equipment_to_insert)
            conn.commit() # Commit all equipment inserts/replaces
            inserted_updated_count = len(equipment_to_insert) # Or cur.rowcount if preferred
        except sqlite3.Error as e:
            print(f"Error bulk inserting/replacing equipment: {e}")
            conn.rollback()
        except Exception as ex:
            print(f"Generic error during bulk equipment processing: {ex}")
            conn.rollback()
    return inserted_updated_count

def populate_unit_validation_options(conn):
    filepath = MEKFILES_INPUT_DIR / "UnitVerifierOptions.json"
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return 0

    options_data_root = None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            options_data_root = json.load(f)

        options_data = options_data_root.get('entityverifier')
        if not options_data:
            print(f"Error: 'entityverifier' key not found in {filepath}")
            return 0

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {filepath}: {e}")
        return 0
    except Exception as ex:
        print(f"Error reading {filepath}: {ex}")
        return 0

    sql = """
    INSERT OR REPLACE INTO unit_validation_options
        (name, data, created_at, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """
    cur = conn.cursor()
    try:
        cur.execute(sql, ('DefaultSettings', json.dumps(options_data)))
        conn.commit()
        return 1
    except sqlite3.Error as e:
        print(f"Error inserting/replacing unit_validation_options: {e}")
        return 0
    except Exception as ex:
        print(f"Generic error processing unit_validation_options: {ex}")
        return 0

def populate_units(conn):
    inserted_updated_count = 0
    units_to_insert = []
    BATCH_SIZE = 500
    cur = conn.cursor()

    sql = """
    INSERT OR REPLACE INTO units
        (original_file_path, unit_type, chassis, model, mul_id, tech_base, era, mass_tons, role, source_book, is_omnimech, omnimech_base_chassis, omnimech_configuration, config, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """

    for dirpath, _, filenames in os.walk(MEKFILES_INPUT_DIR):
        for filename in filenames:
            if filename.endswith(".json") and filename not in ["derivedEquipment.json", "UnitVerifierOptions.json"]:
                filepath = os.path.join(dirpath, filename)
                original_file_rel_path = str(Path(filepath).relative_to(MEKFILES_INPUT_DIR))

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        unit_json_data = json.load(f)

                    relative_to_mekfiles_root = Path(dirpath).relative_to(MEKFILES_INPUT_DIR)
                    unit_type = relative_to_mekfiles_root.parts[0] if relative_to_mekfiles_root.parts else "Unknown"

                    chassis = unit_json_data.get('chassis', unit_json_data.get('name'))
                    model = unit_json_data.get('model', '')
                    
                    # If chassis is still None/empty, try to extract from filename
                    if not chassis:
                        # Extract chassis from filename (e.g., "Achileus BA (Sqd 4) [David].json" -> "Achileus BA")
                        filename_without_ext = filename.replace('.json', '')
                        # Split on first parenthesis to get the base name
                        if '(' in filename_without_ext:
                            chassis = filename_without_ext.split('(')[0].strip()
                        else:
                            chassis = filename_without_ext
                    
                    # If model is still empty, try to extract from filename
                    if not model and '(' in filename and ')' in filename:
                        # Extract model from parentheses and brackets (e.g., "(Sqd 4) [David]" -> "Sqd 4 David")
                        import re
                        # Find content in parentheses and brackets
                        paren_match = re.search(r'\(([^)]+)\)', filename)
                        bracket_match = re.search(r'\[([^\]]+)\]', filename)
                        
                        model_parts = []
                        if paren_match:
                            model_parts.append(paren_match.group(1))
                        if bracket_match:
                            model_parts.append(bracket_match.group(1))
                        
                        if model_parts:
                            model = ' '.join(model_parts)
                    mul_id = str(unit_json_data.get('mul_id', '')) if unit_json_data.get('mul_id') is not None else None

                    # Handle tech base with proper validation
                    tech_base = unit_json_data.get('techbase', unit_json_data.get('derived_tech_base', 'Unknown'))
                    if not isinstance(tech_base, str): tech_base = str(tech_base)
                    
                    # Normalize tech base to match schema constraints
                    tech_base_mapping = {
                        'Inner Sphere': 'Inner Sphere',
                        'Clan': 'Clan',
                        'Mixed (IS Chassis)': 'Mixed (IS Chassis)',
                        'Mixed (Clan Chassis)': 'Mixed (Clan Chassis)',
                        'Mixed': 'Mixed (IS Chassis)',  # Default mixed to IS chassis
                        'IS': 'Inner Sphere',
                        'C': 'Clan',
                        'Unknown': 'Inner Sphere'  # Default unknown to Inner Sphere
                    }
                    tech_base = tech_base_mapping.get(tech_base, 'Inner Sphere')

                    era_raw = unit_json_data.get('era', unit_json_data.get('derived_era', 'Unknown'))
                    era = str(era_raw)

                    mass_raw = unit_json_data.get('mass', unit_json_data.get('tonnage'))
                    mass_tons = None
                    if mass_raw is not None:
                        try: mass_tons = int(float(mass_raw))
                        except (ValueError, TypeError): pass

                    role = unit_json_data.get('role', 'Unknown')
                    if not isinstance(role, str): role = str(role)

                    source_book = unit_json_data.get('source', unit_json_data.get('source_book'))
                    if not isinstance(source_book, str) and source_book is not None: source_book = str(source_book)

                    # Extract OmniMech information
                    config = unit_json_data.get('Config', unit_json_data.get('config', ''))
                    if not isinstance(config, str): config = str(config) if config else ''
                    
                    # Determine if this is an OmniMech
                    is_omnimech = 'Omnimech' in config or 'OmniMech' in config or unit_json_data.get('is_omnimech', False)
                    
                    # Extract OmniMech base chassis and configuration
                    omnimech_base_chassis = None
                    omnimech_configuration = None
                    
                    if is_omnimech:
                        # Try to extract base chassis (everything before configuration letter/designation)
                        omnimech_base_chassis = chassis
                        
                        # Try to extract configuration from model field or filename
                        if model and any(variant in model.upper() for variant in ['PRIME', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']):
                            # Look for standard OmniMech configuration patterns
                            import re
                            config_match = re.search(r'\b(Prime|[A-H])\b', model, re.IGNORECASE)
                            if config_match:
                                omnimech_configuration = config_match.group(1).title()
                            elif 'Prime' in model:
                                omnimech_configuration = 'Prime'
                        
                        # If no configuration found in model, check for it in chassis
                        if not omnimech_configuration and chassis:
                            import re
                            config_match = re.search(r'\b(Prime|[A-H])\b', chassis, re.IGNORECASE)
                            if config_match:
                                omnimech_configuration = config_match.group(1).title()
                                # Remove configuration from base chassis name
                                omnimech_base_chassis = re.sub(r'\s*(Prime|[A-H])\b', '', chassis, flags=re.IGNORECASE).strip()

                    units_to_insert.append((
                        original_file_rel_path, unit_type, chassis, model, mul_id,
                        tech_base, era, mass_tons, role, source_book,
                        is_omnimech, omnimech_base_chassis, omnimech_configuration, config,
                        json.dumps(unit_json_data)
                    ))

                    if len(units_to_insert) >= BATCH_SIZE:
                        cur.executemany(sql, units_to_insert)
                        inserted_updated_count += len(units_to_insert)
                        units_to_insert = []

                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON from {filepath}: {e}")
                except sqlite3.Error as e: # This will catch errors from executemany
                    print(f"Database error processing batch of units (up to {original_file_rel_path}): {e}")
                    # Decide if to rollback here or let main handle it
                    conn.rollback() # Rollback this batch
                    units_to_insert = [] # Clear batch as it failed
                except Exception as ex:
                    print(f"Generic error processing unit file {filepath}: {ex}")

    # Insert any remaining units
    if units_to_insert:
        try:
            cur.executemany(sql, units_to_insert)
            inserted_updated_count += len(units_to_insert)
        except sqlite3.Error as e:
            print(f"Database error processing final batch of units: {e}")
            conn.rollback()
        except Exception as ex:
            print(f"Generic error processing final batch of units: {ex}")
            conn.rollback()

    conn.commit() # Commit all unit inserts/replaces
    return inserted_updated_count

def main():
    conn = None
    try:
        # Remove old DB file if it exists to ensure fresh start
        if os.path.exists(SQLITE_DB_FILE):
            print(f"Removing existing SQLite DB file: {SQLITE_DB_FILE}")
            os.remove(SQLITE_DB_FILE)

        conn = get_db_connection()
        if conn is None:
            return

        if not create_schema(conn):
            print("Halting due to schema creation failure.")
            return

        print("Starting database population...")

        eq_count = populate_equipment(conn)
        print(f"Processed {eq_count} equipment items.")

        opt_count = populate_unit_validation_options(conn)
        print(f"Processed {opt_count} unit validation options rows.")

        unit_count = populate_units(conn)
        print(f"Processed {unit_count} unit files.")

        print("Database population complete.")

    except sqlite3.Error as e: # Catch SQLite specific errors in main
        print(f"A SQLite database error occurred during main execution: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during main execution: {e}")
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    if not os.path.isdir(MEKFILES_INPUT_DIR):
        print(f"Error: Input directory '{MEKFILES_INPUT_DIR}' not found.")
        print(f"Ensure the '{BASE_INPUT_DIR}' directory exists and contains 'mekfiles' with converted JSON data.")
        print(f"Current working directory: {os.getcwd()}")
        # Use str() for printing Path objects in f-string if not implicitly converted,
        # though modern Python handles it. os.path.abspath also works with Path objects.
        print(f"Expected structure: {os.path.abspath(str(BASE_INPUT_DIR))}/mekfiles/")
    else:
        main()
