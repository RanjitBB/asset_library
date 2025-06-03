#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Root directory to scan
const ROOT_DIR = process.cwd();

/**
 * Main function to generate the asset manifest
 */
async function generateAssetManifest() {
  try {
    console.log(`Scanning directory: ${ROOT_DIR}`);
    
    // Scan directory and get all files
    const files = await scanDirectory(ROOT_DIR);
    console.log(`Found ${files.length} files`);
    
    // Process each file to create asset objects
    const assetsList = await Promise.all(files.map(file => processAsset(file)));
    
    // Create a hierarchical structure based on directory paths
    const assetsHierarchy = [];
    
    // First, handle color_palette.json specially
    let colorPaletteContent = null;
    try {
      const colorPalettePath = path.join(ROOT_DIR, 'color', 'color_palette.json');
      const content = await fs.readFile(colorPalettePath, 'utf8');
      colorPaletteContent = JSON.parse(content);
      
      // Create a special entry for color palette with its content
      const colorPaletteEntry = {
        title: "Color Palette",
        type: "color_palette",
        description: "Application color scheme. Color4 is designated as the primary color; other colors serve as secondary or accent colors.",
        relativePath: "assets_library/color/color_palette.json",
        palette: colorPaletteContent.palette
      };
      
      // Add it as the first item
      assetsHierarchy.push(colorPaletteEntry);
    } catch (error) {
      console.error('Error processing color palette:', error);
    }
    
    // Group assets by their directory structure
    const directoryGroups = {};
    
    // First pass: organize assets by directory
    for (const asset of assetsList) {
      const pathParts = asset.relativePath.split('/');
      
      // Skip color_palette.json as it's already handled
      if (asset.relativePath === 'assets_library/color/color_palette.json') {
        continue;
      }
      
      // Skip other files at root level
      if (pathParts.length <= 1) {
        continue;
      }
      
      // Get the top-level directory
      const topDir = pathParts[0];
      
      if (!directoryGroups[topDir]) {
        directoryGroups[topDir] = [];
      }
      
      directoryGroups[topDir].push(asset);
    }
    
    // Second pass: add directory groups to the hierarchy
    for (const [directory, assets] of Object.entries(directoryGroups)) {
      // Create a directory entry
      const dirEntry = {
        title: directory.charAt(0).toUpperCase() + directory.slice(1).replace(/_/g, ' '),
        type: 'directory',
        assets: []
      };
      
      // Group assets by subdirectory if applicable
      const subDirGroups = {};
      
      for (const asset of assets) {
        const pathParts = asset.relativePath.split('/');
        
        // If there's a subdirectory
        if (pathParts.length > 2) {
          const subDir = pathParts[1];
          
          if (!subDirGroups[subDir]) {
            subDirGroups[subDir] = [];
          }
          
          subDirGroups[subDir].push(asset);
        } else {
          // Assets directly in the top directory
          dirEntry.assets.push(asset);
        }
      }
      
      // Add subdirectory groups
      for (const [subDir, subAssets] of Object.entries(subDirGroups)) {
        const subDirEntry = {
          title: subDir.charAt(0).toUpperCase() + subDir.slice(1).replace(/_/g, ' '),
          type: 'subdirectory',
          assets: subAssets
        };
        
        dirEntry.assets.push(subDirEntry);
      }
      
      assetsHierarchy.push(dirEntry);
    }
    
    // Write the manifest to a file
    const manifestPath = path.join(ROOT_DIR, 'asset_manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(assetsHierarchy, null, 2));
    
    console.log(`Asset manifest generated successfully: ${manifestPath}`);
  } catch (error) {
    console.error('Error generating asset manifest:', error);
  }
}

/**
 * Recursively scan a directory and return all file paths
 * @param {string} dir - Directory to scan
 * @param {string} [baseDir=ROOT_DIR] - Base directory for relative paths
 * @returns {Promise<string[]>} - Array of file paths
 */
async function scanDirectory(dir, baseDir = ROOT_DIR) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      
      // Skip non-asset files
      if (entry.name === '.DS_Store' ||
          entry.name === 'EULA.txt' ||
          entry.name.endsWith('.md') ||
          entry.name === 'generate_asset_manifest.js' ||
          entry.name === 'asset_manifest.json') {
        return [];
      }
      
      if (entry.isDirectory()) {
        return scanDirectory(fullPath, baseDir);
      } else {
        return [fullPath];
      }
    })
  );
  
  return files.flat();
}

/**
 * Process an asset file and create an asset object
 * @param {string} filePath - Path to the asset file
 * @returns {Promise<Object>} - Asset object
 */
async function processAsset(filePath) {
  // Get the relative path and prepend 'assets_library/'
  const relativePath = 'assets_library/' + path.relative(ROOT_DIR, filePath);
  const title = generateTitle(filePath);
  const type = await determineType(filePath);
  const description = await createDescription(filePath, type);
  
  return {
    title,
    description,
    relativePath,
    type
  };
}

/**
 * Generate a title from a file path
 * @param {string} filePath - Path to the asset file
 * @returns {string} - Generated title
 */
function generateTitle(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Convert snake_case or kebab-case to Title Case
  return fileName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Determine the type of an asset
 * @param {string} filePath - Path to the asset file
 * @returns {Promise<string>} - Asset type
 */
async function determineType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const dirName = path.dirname(filePath).split(path.sep).pop();
  
  // Check if it's a color palette
  if (path.basename(filePath) === 'color_palette.json') {
    return 'color_palette';
  }
  
  // Check file extension
  switch (ext) {
    case '.svg':
      // Determine SVG type based on directory structure
      if (filePath.includes('/buttons/')) {
        return 'svg_button';
      } else if (filePath.includes('/backgrounds/')) {
        return 'svg_background';
      } else if (filePath.includes('/input_fields/')) {
        return 'svg_input';
      } else if (filePath.includes('/navigation/')) {
        return 'svg_navigation';
      } else {
        return 'svg_icon';
      }
    
    case '.otf':
    case '.ttf':
    case '.woff':
    case '.woff2':
      return 'font';
    
    case '.png':
    case '.jpg':
    case '.jpeg':
      if (filePath.includes('/backgrounds/')) {
        return 'image_background';
      } else {
        return 'image';
      }
    
    default:
      return 'other';
  }
}

/**
 * Create a description for an asset
 * @param {string} filePath - Path to the asset file
 * @param {string} type - Asset type
 * @returns {Promise<string>} - Asset description
 */
async function createDescription(filePath, type) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath).split(path.sep).pop();
  
  switch (type) {
    case 'svg_button':
      // Extract size from path
      const sizeMatch = filePath.match(/size_(\d+)_px/);
      const size = sizeMatch ? sizeMatch[1] + 'px' : '';
      return `A ${fileName.replace(/[-_]/g, ' ')} button (${size}) used for user interaction in the interface.`;
    
    case 'svg_background':
      // Create more descriptive background descriptions
      const bgName = fileName.replace(/[-_]/g, ' ');
      return `A background image depicting a ${bgName} scene, suitable for creating immersive environments in simulations.`;
    
    case 'svg_input':
      // Get input category from path
      const inputCategory = filePath.split(path.sep).slice(-2)[0];
      return `An ${inputCategory} input field in ${fileName.replace(/[-_]/g, ' ')} state for user data entry and form interaction.`;
    
    case 'svg_navigation':
      return `A navigation control for ${fileName.replace(/[-_]/g, ' ')} interaction, used for moving between screens or sections.`;
    
    case 'svg_icon':
      return `An icon representing ${fileName.replace(/[-_]/g, ' ')}.`;
    
    case 'font':
      // Extract font name and style from filename
      const parts = fileName.split(/[-_]/);
      const fontName = parts[0];
      const fontStyle = parts.length > 1 ? parts.slice(1).join(' ') : 'Regular';
      
      return `Font: ${fontName}, Style: ${fontStyle}`;
    
    case 'image_background':
      return `A background image depicting a ${fileName.replace(/[-_]/g, ' ')} scene, suitable for creating immersive environments in simulations.`;
    
    case 'color_palette':
      // Read and parse the color palette file
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const palette = JSON.parse(content);
        
        // Extract color4 values from each category
        const primaryColors = [];
        for (const category in palette.palette) {
          for (const colorKey in palette.palette[category]) {
            if (colorKey.includes('4')) {
              primaryColors.push(`${colorKey}: ${palette.palette[category][colorKey]}`);
            }
          }
        }
        
        return `Application color scheme. Color4 is designated as the primary color; other colors serve as secondary or accent colors. Colors include: ${primaryColors.join(', ')}`;
      } catch (error) {
        return 'Application color scheme.';
      }
    
    default:
      return `A ${fileName.replace(/[-_]/g, ' ')} asset.`;
  }
}

// Run the main function
generateAssetManifest();