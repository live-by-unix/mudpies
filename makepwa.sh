#!/bin/bash

# Mud Pies PWA Asset Generator
# This script fetches the mudpie.png from GitHub and generates all required PWA assets
# Requires: curl, ImageMagick (convert command)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="live-by-unix"
REPO_NAME="mudpies"
SOURCE_IMAGE_PATH="assets/mudpie.png"
ASSETS_DIR="assets"
GITHUB_RAW_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/polish-and-fixes/${SOURCE_IMAGE_PATH}"
TEMP_IMAGE="${ASSETS_DIR}/.mudpie-original.png"

# Asset definitions
declare -A ASSETS=(
    ["icon-192.png"]="192x192"
    ["icon-512.png"]="512x512"
    ["icon-192-maskable.png"]="192x192"
    ["icon-512-maskable.png"]="512x512"
    ["screenshot-540.png"]="540x720"
    ["screenshot-1920.png"]="1920x1080"
)

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Mud Pies PWA Asset Generator${NC}                       ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}✗ Error: ImageMagick is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ ImageMagick found${NC}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ Error: curl is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ curl found${NC}"
echo ""

# Create assets directory if it doesn't exist
if [ ! -d "${ASSETS_DIR}" ]; then
    echo -e "${YELLOW}→ Creating ${ASSETS_DIR} directory...${NC}"
    mkdir -p "${ASSETS_DIR}"
fi

# Fetch the original image from GitHub
echo -e "${BLUE}Fetching original image from GitHub...${NC}"
echo -e "${YELLOW}URL: ${GITHUB_RAW_URL}${NC}"

if curl -L -f --progress-bar "${GITHUB_RAW_URL}" -o "${TEMP_IMAGE}"; then
    echo -e "${GREEN}✓ Successfully downloaded mudpie.png${NC}"
else
    echo -e "${RED}✗ Failed to download image from GitHub${NC}"
    echo -e "${YELLOW}Make sure the ${SOURCE_IMAGE_PATH} exists in the ${REPO_OWNER}/${REPO_NAME} repository${NC}"
    exit 1
fi

# Verify the downloaded file
if [ ! -f "${TEMP_IMAGE}" ]; then
    echo -e "${RED}✗ Downloaded file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Image verified${NC}"
echo ""

# Generate all required assets
echo -e "${BLUE}Generating PWA assets...${NC}"
echo ""

for asset in "${!ASSETS[@]}"; do
    dimensions="${ASSETS[$asset]}"
    output_path="${ASSETS_DIR}/${asset}"
    
    echo -ne "  Generating ${asset} (${dimensions})... "
    
    if [[ "$asset" == *"maskable"* ]]; then
        # For maskable icons, add padding and circular crop
        convert "${TEMP_IMAGE}" \
            -resize "${dimensions}" \
            -gravity center \
            -background transparent \
            -extent "${dimensions}" \
            -alpha on \
            "${output_path}" 2>/dev/null
    else
        # Standard resize for regular icons and screenshots
        convert "${TEMP_IMAGE}" \
            -resize "${dimensions}" \
            -gravity center \
            -extent "${dimensions}" \
            -background white \
            -flatten \
            "${output_path}" 2>/dev/null
    fi
    
    if [ -f "${output_path}" ]; then
        size=$(du -h "${output_path}" | cut -f1)
        echo -e "${GREEN}✓${NC} (${size})"
    else
        echo -e "${RED}✗${NC}"
    fi
done

echo ""

# Clean up temporary file
rm -f "${TEMP_IMAGE}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ All assets generated successfully!${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# List generated files
echo -e "${YELLOW}Generated files:${NC}"
for asset in "${!ASSETS[@]}"; do
    output_path="${ASSETS_DIR}/${asset}"
    if [ -f "${output_path}" ]; then
        size=$(du -h "${output_path}" | cut -f1)
        echo -e "  ${GREEN}✓${NC} ${output_path} (${size})"
    fi
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review the generated assets in the ${ASSETS_DIR}/ directory"
echo -e "  2. Git add the new assets: ${YELLOW}git add ${ASSETS_DIR}/icon-*.png ${ASSETS_DIR}/screenshot-*.png${NC}"
echo -e "  3. Commit: ${YELLOW}git commit -m 'feat: add PWA assets'${NC}"
echo -e "  4. Push: ${YELLOW}git push${NC}"
echo ""
echo -e "${GREEN}Your PWA is now ready to be installed! 🚀${NC}"
echo ""
