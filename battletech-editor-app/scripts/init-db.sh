#!/bin/sh

DB_FILE="/usr/src/app/battletech_dev.sqlite"
DATA_DIR="/usr/src/app/data"
POPULATE_SCRIPT="$DATA_DIR/populate_db.py"

echo "=== Database Initialization Script ==="

# Check if database already exists
if [ -f "$DB_FILE" ]; then
    echo "Database already exists at $DB_FILE"
    echo "Skipping database initialization."
else
    echo "Database not found. Initializing database..."
    
    # Check if populate script exists
    if [ ! -f "$POPULATE_SCRIPT" ]; then
        echo "ERROR: Population script not found at $POPULATE_SCRIPT"
        exit 1
    fi
    
    # Check if mekfiles data exists
    if [ ! -d "$DATA_DIR/megameklab_converted_output/mekfiles" ]; then
        echo "ERROR: Mekfiles data directory not found at $DATA_DIR/megameklab_converted_output/mekfiles"
        echo "Available files in data directory:"
        ls -la "$DATA_DIR"
        exit 1
    fi
    
    echo "Running database population script..."
    cd "$DATA_DIR"
    python3 "$POPULATE_SCRIPT"
    
    if [ $? -eq 0 ]; then
        echo "Database initialization completed successfully."
        
        # Move database to expected location if it was created in data directory
        if [ -f "$DATA_DIR/battletech_dev.sqlite" ] && [ "$DATA_DIR/battletech_dev.sqlite" != "$DB_FILE" ]; then
            mv "$DATA_DIR/battletech_dev.sqlite" "$DB_FILE"
            echo "Database moved to $DB_FILE"
        fi
    else
        echo "ERROR: Database initialization failed!"
        exit 1
    fi
fi

echo "Starting Next.js application..."
exec npm start
