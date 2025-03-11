import { List, ActionPanel, Action, Icon, Toast, showToast, Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";
import { ZoteroItem } from "../types/zoteroItems";
import { ZoteroService } from "../services/zotero/ZoteroService";
import { ZoteroApiError, ZoteroAuthenticationError, ZoteroRateLimitError } from "../services/zotero/errors";
import { getZoteroPreferences } from "../preferences";

interface State {
  isLoading: boolean;
  searchText: string;
  items: ZoteroItem[];
  error?: Error;
}

export default function CitationList() {
  const preferences = getZoteroPreferences();
  const [state, setState] = useState<State>({
    isLoading: true,
    searchText: "",
    items: [],
  });

  // Get the singleton instance of ZoteroService
  const getZoteroService = () => {
    return ZoteroService.getInstance({
      apiKey: preferences.apiKey,
      userId: preferences.userId,
    });
  };

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    if (state.searchText) {
      searchItems();
    } else {
      loadLibrary();
    }
  }, [state.searchText]);

  async function initializeService() {
    try {
      const zoteroService = getZoteroService();
      await zoteroService.authenticate();
      await loadLibrary();
    } catch (error) {
      handleError(error);
    }
  }

  async function loadLibrary() {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const zoteroService = getZoteroService();
      const items = await zoteroService.getUserLibrary();
      
      // Filter to only show journal articles
      const filteredItems = items.filter(item => 
        item.data?.itemType === "journalArticle"
      );
      
      console.log(`Filtered ${items.length} total items to ${filteredItems.length} journal articles`);
      
      setState((prev) => ({ 
        ...prev, 
        items: filteredItems, 
        isLoading: false, 
        error: undefined 
      }));
    } catch (error) {
      handleError(error);
    }
  }

  async function searchItems() {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const zoteroService = getZoteroService();
      const items = await zoteroService.searchItems(state.searchText);
      setState((prev) => ({ ...prev, items, isLoading: false, error: undefined }));
    } catch (error) {
      handleError(error);
    }
  }

  function handleError(error: unknown) {
    setState((prev) => ({ ...prev, isLoading: false }));
    
    if (error instanceof ZoteroAuthenticationError) {
      showToast({
        style: Toast.Style.Failure,
        title: "Authentication Failed",
        message: "Please check your API key and user ID in preferences. Make sure to use your numeric user ID from Zotero settings.",
        primaryAction: {
          title: "Open Preferences",
          onAction: () => {
            showToast({
              style: Toast.Style.Success,
              title: "Opening Preferences...",
              message: "Enter your numeric user ID (e.g., 6537753) and API key"
            });
          }
        }
      });

      setState((prev) => ({
        ...prev,
        error: new Error(
          "Authentication failed. Please verify:\n\n" +
          "1. Your numeric user ID (from Zotero settings/keys)\n" +
          "2. Your 24-character API key\n" +
          "3. API key has 'Allow library access' enabled"
        )
      }));
    } else if (error instanceof ZoteroRateLimitError) {
      showToast({
        style: Toast.Style.Failure,
        title: "Too Many Requests",
        message: "Please try again in a moment",
      });
      setState((prev) => ({
        ...prev,
        error: new Error("Rate limit exceeded. Please wait a moment and try again.")
      }));
    } else {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: errorMessage,
      });
      setState((prev) => ({
        ...prev,
        error: new Error(errorMessage)
      }));
    }
  }

  function formatAuthors(item: ZoteroItem): string {
    console.log('formatAuthors - Item data:', item.data);
    
    // Basic safety check
    if (!item.data?.creators || !Array.isArray(item.data.creators) || item.data.creators.length === 0) {
      console.log('formatAuthors - No valid creators found');
      return "No authors";
    }

    // Filter for authors and format them
    const authors = item.data.creators
      .filter(creator => creator.creatorType === "author")
      .map(author => {
        // Handle different author formats
        if (author.name) {
          return author.name;
        }
        // Handle cases where either firstName or lastName might be missing
        return [author.lastName, author.firstName].filter(Boolean).join(', ');
      });

    console.log('formatAuthors - Processed authors:', authors);

    if (authors.length === 0) {
      return "No authors";
    }

    if (authors.length === 1) {
      return authors[0] || "Unknown Author";
    }

    if (authors.length === 2) {
      return `${authors[0] || "Unknown"} & ${authors[1] || "Unknown"}`;
    }

    return `${authors[0] || "Unknown"} et al.`;
  }

  function formatInTextCitation(item: ZoteroItem): string {
    console.log('formatInTextCitation - Item:', JSON.stringify(item).substring(0, 300));
    
    // Safely access data with defaults
    if (!item.data) {
      console.log('formatInTextCitation - No data property');
      return "(Unknown, n.d.)";
    }
    
    // Get author(s)
    const authors = item.data.creators?.filter(c => c.creatorType === "author") || [];
    const firstName = authors[0]?.lastName || "Unknown";
    
    // Get year
    const year = item.data.date ? item.data.date.substring(0, 4) : "n.d.";
    
    console.log(`formatInTextCitation - Using author: ${firstName}, year: ${year}`);
    
    // Build citation
    if (authors.length <= 1) {
      return `(${firstName}, ${year})`;
    }
    
    return `(${firstName} et al., ${year})`;
  }

  function formatBibliographyEntry(item: ZoteroItem): string {
    console.log('formatBibliographyEntry - Item:', JSON.stringify(item).substring(0, 300));
    
    // Safely access data with defaults
    if (!item.data) {
      console.log('formatBibliographyEntry - No data property');
      return "Unknown. (n.d.). Untitled.";
    }
    
    // Get authors
    const authorsArray = item.data.creators?.filter(c => c.creatorType === "author") || [];
    const authors = authorsArray.length > 0 
      ? authorsArray.map(a => `${a.lastName || "Unknown"}, ${a.firstName ? a.firstName.charAt(0) + "." : ""}`).join(", ")
      : "Unknown";
    
    // Get other fields
    const year = item.data.date ? item.data.date.substring(0, 4) : "n.d.";
    const title = item.data.title || "Untitled";
    
    console.log(`formatBibliographyEntry - Using authors: ${authors}, year: ${year}, title: ${title}`);
    
    // Return simple bibliography entry for initial testing
    return `${authors} (${year}). ${title}.`;
  }

  async function copyToClipboard(text: string, description: string) {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Copying...",
      });

      await Clipboard.copy(text);

      await showToast({
        style: Toast.Style.Success,
        title: "Copied!",
        message: description,
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to copy",
        message: "Please try again",
      });
    }
  }

  // Add this before the return statement
  useEffect(() => {
    if (state.items.length > 0) {
      const firstItem = state.items[0];
      console.log('DETAILED CITATION ITEM ANALYSIS:');
      console.log('- Item key:', firstItem.key);
      console.log('- Data property exists:', !!firstItem.data);
      if (firstItem.data) {
        console.log('- Title:', firstItem.data.title);
        console.log('- Item type:', firstItem.data.itemType);
        console.log('- Date:', firstItem.data.date);
        console.log('- Creators exist:', !!firstItem.data.creators);
        console.log('- Creator count:', firstItem.data.creators?.length || 0);
        if (firstItem.data.creators?.length > 0) {
          console.log('- First creator:', JSON.stringify(firstItem.data.creators[0]));
        }
        console.log('- Publication:', firstItem.data.publicationTitle);
      }
    }
  }, [state.items]);

  return (
    <List
      isLoading={state.isLoading}
      onSearchTextChange={(text) => setState((prev) => ({ ...prev, searchText: text }))}
      searchBarPlaceholder="Search your Zotero library..."
      throttle
    >
      {state.error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error"
          description={state.error.message}
          actions={
            <ActionPanel>
              <Action
                title="Try Again"
                icon={Icon.ArrowClockwise}
                onAction={state.searchText ? searchItems : loadLibrary}
              />
            </ActionPanel>
          }
        />
      ) : state.items.length === 0 ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title={state.searchText ? "No matching journal articles found" : "No journal articles in your library"}
          description={state.searchText 
            ? "Try a different search term or add more journal articles to your Zotero library" 
            : "Only journal articles are displayed. Add articles to your Zotero library to see them here."}
        />
      ) : (
        state.items.map((item) => {
          // Authors are in data.creators
          const authors = item.data?.creators 
            ? item.data.creators
                .filter(c => c.creatorType === "author")
                .map(c => `${c.lastName || ''}${c.firstName ? `, ${c.firstName}` : ''}`.trim())
                .join('; ')
            : 'Unknown Author';
          
          // Date is in data.date
          const date = item.data?.date 
            ? item.data.date.substring(0, 4) // Get just the year
            : 'No Date';
          
          // Publication info
          const publication = item.data?.publicationTitle || 
                              item.data?.journalAbbreviation || 
                              'Unknown Journal';
          
          return (
            <List.Item
              key={item.key}
              title={item.data?.title || 'Untitled Article'}
              subtitle={authors}
              accessories={[
                { text: date, tooltip: `Published: ${item.data?.date || 'Unknown date'}` },
                { text: publication, tooltip: 'Journal' }
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action
                      title="Copy Bibliography Entry"
                      icon={Icon.TextDocument}
                      onAction={() => {
                        const bibliography = formatBibliographyEntry(item);
                        copyToClipboard(bibliography, "Bibliography entry copied to clipboard");
                      }}
                    />
                    <Action
                      title="Copy Citation"
                      icon={Icon.Text}
                      onAction={() => {
                        const citation = formatInTextCitation(item);
                        copyToClipboard(citation, "Citation copied to clipboard");
                      }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
} 