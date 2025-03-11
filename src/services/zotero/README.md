# Zotero API Service

This module provides a client for interacting with the Zotero API. It allows you to access user and group libraries, search for items, and handle API errors gracefully.

## Usage

### Basic Setup

```typescript
import { ZoteroService } from './services/zotero';

// Create a service instance with your API key
const zoteroService = new ZoteroService({
  apiKey: 'YOUR_API_KEY',
  userId: 'YOUR_USER_ID', // Either userId or groupId is required
});

// Authenticate with the Zotero API
await zoteroService.authenticate();
```

### Fetching User Library

```typescript
// Get all items in the user's library
const items = await zoteroService.getUserLibrary();
```

### Searching for Items

```typescript
// Search for items by title
const searchResults = await zoteroService.searchItems('Machine Learning');

// Advanced search with multiple parameters
const advancedResults = await zoteroService.advancedSearch({
  q: 'Machine Learning',
  itemType: 'journalArticle',
  limit: 10,
});
```

## Error Handling

The service provides custom error classes to handle different types of API errors:

- `ZoteroApiError`: Base error class for all API errors
- `ZoteroAuthenticationError`: Thrown when authentication fails
- `ZoteroRateLimitError`: Thrown when rate limits are exceeded
- `ZoteroNotFoundError`: Thrown when a resource is not found

Example:

```typescript
try {
  const items = await zoteroService.getUserLibrary();
} catch (error) {
  if (error instanceof ZoteroAuthenticationError) {
    // Handle authentication error
  } else if (error instanceof ZoteroApiError) {
    // Handle other API errors
  } else {
    // Handle unexpected errors
  }
}
```

## Testing

Unit tests are provided to verify the functionality of the Zotero service. Run the tests with:

```bash
npm test
```

## Implementation Notes

This is a mock implementation that doesn't perform actual network requests. It's designed to provide the API structure for future implementation of real API calls.

When implementing the actual API calls, update the methods in `ZoteroService.ts` to use the utility functions in `utils.ts` for building URLs and handling responses. 