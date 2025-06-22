#!/bin/bash

echo "Compiling equipment reference extractor..."

# Find MegaMekLab JAR file
MEGAMEKLAB_JAR=$(find . -name "*.jar" | grep -i megameklab | head -1)

if [ -z "$MEGAMEKLAB_JAR" ]; then
    echo "MegaMekLab JAR not found. Looking for compiled classes..."
    # Try to use build directory
    CLASSPATH="./build/classes/main:./build/libs/*:./lib/*"
else
    echo "Found MegaMekLab JAR: $MEGAMEKLAB_JAR"
    CLASSPATH="$MEGAMEKLAB_JAR:./lib/*"
fi

# Add gson dependency if available
GSON_JAR=$(find . -name "*gson*.jar" 2>/dev/null | head -1)
if [ -n "$GSON_JAR" ]; then
    CLASSPATH="$CLASSPATH:$GSON_JAR"
else
    echo "Warning: Gson JAR not found. You may need to download it."
    echo "Download from: https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar"
fi

echo "Using classpath: $CLASSPATH"

# Compile the extractor
javac -cp "$CLASSPATH" ExtractEquipmentReferences.java

if [ $? -eq 0 ]; then
    echo "Compilation successful. Running extractor..."
    java -cp "$CLASSPATH:." ExtractEquipmentReferences
else
    echo "Compilation failed!"
    exit 1
fi
