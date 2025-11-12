#!/bin/bash

# Script to copy card images from game files to public folder
# Source: /Users/shiebenaderet/Desktop/desktop-1/images/1024Portraits
# Destination: /Users/shiebenaderet/Documents/GitHub/slay-the-spire-guide/public/images/cards

SOURCE_DIR="/Users/shiebenaderet/Desktop/desktop-1/images/1024Portraits"
DEST_DIR="/Users/shiebenaderet/Documents/GitHub/slay-the-spire-guide/public/images/cards"

# Character color mapping
# red = ironclad, green = silent, blue = defect, purple = watcher
declare -A COLOR_MAP
COLOR_MAP[red]="ironclad"
COLOR_MAP[green]="silent"
COLOR_MAP[blue]="defect"
COLOR_MAP[purple]="watcher"

echo "🎴 Copying card images from game files..."
echo "Source: $SOURCE_DIR"
echo "Destination: $DEST_DIR"
echo ""

# Create destination directories
mkdir -p "$DEST_DIR/ironclad"
mkdir -p "$DEST_DIR/silent"
mkdir -p "$DEST_DIR/defect"
mkdir -p "$DEST_DIR/watcher"
mkdir -p "$DEST_DIR/colorless"
mkdir -p "$DEST_DIR/curse"
mkdir -p "$DEST_DIR/status"

# Copy character-specific cards
for color in red green blue purple; do
    character="${COLOR_MAP[$color]}"
    echo "Copying $character cards ($color)..."

    # Copy all card types (attack, skill, power)
    for type in attack skill power; do
        if [ -d "$SOURCE_DIR/$color/$type" ]; then
            cp -v "$SOURCE_DIR/$color/$type"/*.png "$DEST_DIR/$character/" 2>/dev/null || true
        fi
    done
done

# Copy colorless cards
echo "Copying colorless cards..."
if [ -d "$SOURCE_DIR/colorless" ]; then
    for type in attack skill power; do
        if [ -d "$SOURCE_DIR/colorless/$type" ]; then
            cp -v "$SOURCE_DIR/colorless/$type"/*.png "$DEST_DIR/colorless/" 2>/dev/null || true
        fi
    done
fi

# Copy curse cards
echo "Copying curse cards..."
if [ -d "$SOURCE_DIR/curse" ]; then
    cp -v "$SOURCE_DIR/curse"/*.png "$DEST_DIR/curse/" 2>/dev/null || true
fi

# Copy status cards
echo "Copying status cards..."
if [ -d "$SOURCE_DIR/status" ]; then
    cp -v "$SOURCE_DIR/status"/*.png "$DEST_DIR/status/" 2>/dev/null || true
fi

echo ""
echo "✅ Copy complete!"
echo ""
echo "Card counts:"
echo "  Ironclad: $(ls -1 "$DEST_DIR/ironclad"/*.png 2>/dev/null | wc -l)"
echo "  Silent: $(ls -1 "$DEST_DIR/silent"/*.png 2>/dev/null | wc -l)"
echo "  Defect: $(ls -1 "$DEST_DIR/defect"/*.png 2>/dev/null | wc -l)"
echo "  Watcher: $(ls -1 "$DEST_DIR/watcher"/*.png 2>/dev/null | wc -l)"
echo "  Colorless: $(ls -1 "$DEST_DIR/colorless"/*.png 2>/dev/null | wc -l)"
echo "  Curse: $(ls -1 "$DEST_DIR/curse"/*.png 2>/dev/null | wc -l)"
echo "  Status: $(ls -1 "$DEST_DIR/status"/*.png 2>/dev/null | wc -l)"
echo "  TOTAL: $(find "$DEST_DIR" -name "*.png" | wc -l)"
