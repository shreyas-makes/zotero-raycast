# Zotero Researcher Raycast Extension

A Raycast extension that helps users quickly access and cite references from their local Zotero library.

## Features

- Connect directly to your local Zotero database without API keys
- Browse your complete Zotero library including:
  - Full bibliographic information (title, authors, publication date)
  - Publication sources and journal titles
  - Item types (journal articles, books, book chapters, etc.)
- View collections and their hierarchies with parent-child relationships
- Search for specific items across your library by title, author, or other metadata
- Filter items by collection to narrow down your research materials
- Read-only access to ensure your Zotero database remains unchanged
- Automatic detection of your Zotero database location (~/Zotero/zotero.sqlite)

## Coming Soon

- Insert citations in various formats
- Quick copy of formatted references
- Support for different citation styles

## Requirements

- Raycast v1.36.0 or higher
- Zotero installed on your machine with a local database (typically in ~/Zotero/zotero.sqlite)
- Node.js and npm for development

## Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Install required packages:
   ```
   npm install sqlite sqlite3
   ```
4. Run the development server: `npm run dev`

## How It Works

This extension connects directly to your local Zotero SQLite database, allowing you to browse and search your Zotero library without needing API credentials. The extension automatically locates your Zotero database in the default location.

## Troubleshooting

If the extension cannot find your Zotero database:
- Make sure Zotero is installed and has been run at least once
- Check that the database exists at `~/Zotero/zotero.sqlite` 