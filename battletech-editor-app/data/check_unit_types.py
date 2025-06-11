import sqlite3
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SQLITE_DB_FILE = SCRIPT_DIR / "battletech_dev.sqlite"

def check_unit_types():
    try:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        cur = conn.cursor()
        
        # Get distinct unit types
        cur.execute("SELECT DISTINCT unit_type, COUNT(*) FROM units GROUP BY unit_type ORDER BY COUNT(*) DESC")
        results = cur.fetchall()
        
        print("Unit types in database:")
        for unit_type, count in results:
            print(f"  {unit_type}: {count} units")
        
        # Get a sample of each unit type
        print("\nSample units for each type:")
        for unit_type, _ in results[:5]:  # Show first 5 types
            cur.execute("SELECT chassis, model, mass_tons FROM units WHERE unit_type = ? LIMIT 3", (unit_type,))
            samples = cur.fetchall()
            print(f"\n{unit_type}:")
            for chassis, model, mass in samples:
                print(f"  - {chassis} {model} ({mass} tons)")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_unit_types()
