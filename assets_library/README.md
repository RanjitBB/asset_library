# Asset Manifest Generator

This tool generates a comprehensive JSON manifest of assets located in a specified directory, intended for use in HTML/CSS/JS interactive simulations.

## Overview

The Asset Manifest Generator recursively scans a directory for assets, processes them, and generates a structured JSON manifest. This manifest provides detailed information about each asset, making it easier for LLMs to select and utilize these assets in interactive simulations.

## Features

- Recursively scans directories for assets
- Categorizes assets by type (buttons, backgrounds, fonts, etc.)
- Generates descriptive titles and detailed descriptions
- Organizes input fields by subcategory (checkbox, dropdown, switch, text)
- Extracts color values from color palettes
- Excludes non-asset files (.DS_Store, EULA.txt, etc.)

## Usage

```bash
node generate_asset_manifest.js
```

By default, the script scans the current working directory. The generated manifest is saved as `asset_manifest.json` in the same directory.

## Output Structure

The generated JSON manifest is structured hierarchically to mirror the directory structure:

```json
[
  {
    "title": "Color Palette",
    "description": "Application color scheme. Color4 is designated as the primary color; other colors serve as secondary or accent colors.",
    "relativePath": "assets_library/color/color_palette.json",
    "type": "color_palette",
    "palette": {
      "yellow": {
        "yellow1": "#FCF4E4",
        "yellow2": "#FFDC83",
        "yellow3": "#FFCF56",
        "yellow4": "#FFBA07",
        // More colors...
      },
      // More color categories...
    }
  },
  {
    "title": "Assets library",
    "type": "directory",
    "assets": [
      {
        "title": "Backgrounds",
        "type": "subdirectory",
        "assets": [
          {
            "title": "Forest",
            "description": "A background image depicting a forest scene, suitable for creating immersive environments in simulations.",
            "relativePath": "assets_library/backgrounds/forest.svg",
            "type": "svg_background"
          },
          // More backgrounds...
        ]
      },
      // More directories...
    ]
  }
  {
    "title": "Buttons",
    "type": "directory",
    "assets": [
      {
        "title": "Size 48 px",
        "type": "subdirectory",
        "assets": [
          {
            "title": "Primary",
            "description": "A primary button (48px) used for user interaction in the interface.",
            "relativePath": "buttons/size_48_px/primary.svg",
            "type": "svg_button"
          },
          // More buttons...
        ]
      },
      // More size directories...
    ]
  },
  {
    "title": "Fonts",
    "type": "directory",
    "assets": [
      {
        "title": "Athletics",
        "type": "subdirectory",
        "assets": [
          {
            "title": "Athletics Bold",
            "description": "Font: Athletics, Style: Bold",
            "relativePath": "fonts/Athletics/Athletics Bold/Athletics-Bold.otf",
            "type": "font"
          },
          // More fonts...
        ]
      },
      // More font families...
    ]
  },
  {
    "title": "Input fields",
    "type": "directory",
    "assets": [
      {
        "title": "Checkbox",
        "type": "subdirectory",
        "assets": [
          {
            "title": "Checked On",
            "description": "An checkbox input field in checked on state for user data entry and form interaction.",
            "relativePath": "input_fields/checkbox/checked_on.svg",
            "type": "svg_input"
          },
          // More checkbox inputs...
        ]
      },
      // More input field types...
    ]
  },
  // Other directories...
]
```

## Directory Structure

The manifest organizes assets hierarchically based on their directory structure:

- Root level: Contains the color palette and top-level directories
- Directories: Represent the main asset categories (backgrounds, buttons, fonts, input_fields, navigation)
- Subdirectories: Represent subcategories within each main category (e.g., button sizes, font families, input field types)

Each directory entry includes:
- `title`: The directory name in Title Case
- `type`: Either "directory" or "subdirectory"
- `assets`: An array of assets or subdirectories contained within

## Asset Types

The script identifies and categorizes assets into the following types:

- `svg_button`: Button SVGs (from the buttons directory)
- `svg_background`: Background SVGs (from the backgrounds directory)
- `svg_input`: Input field SVGs
- `svg_navigation`: Navigation control SVGs
- `svg_icon`: Icon SVGs
- `font`: Font files (.otf, .ttf, .woff, .woff2)
- `image_background`: Background images (.png, .jpg, .jpeg)
- `image`: Other images
- `color_palette`: Color palette files
- `other`: Other file types

## Asset Information

Each asset in the manifest includes:

- `title`: A human-readable title derived from the asset's filename
- `description`: A concise, functional description of the asset
- `relativePath`: The path to the asset file, relative to the root directory

## Customization

You can modify the script to:

- Change the root directory to scan
- Add or modify asset type detection
- Customize the description generation logic
- Add additional metadata to assets
- Change the output format or structure

## Requirements

- Node.js (v12 or higher)