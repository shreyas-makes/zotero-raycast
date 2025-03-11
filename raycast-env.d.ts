/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Zotero API Key - Your Zotero API key. You can find this at https://www.zotero.org/settings/keys */
  "apiKey"?: string,
  /** Zotero User ID - Your numeric Zotero user ID. Find this at https://www.zotero.org/settings/keys under 'Your user ID for use in API calls' */
  "userId"?: string,
  /** Use Local Database - Connect directly to your local Zotero database instead of using the API. Requires Zotero desktop to be installed. */
  "useLocalDatabase": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
}

