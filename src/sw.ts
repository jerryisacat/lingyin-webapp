/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from "@serwist/strategies";
import { ExpirationPlugin } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // App Shell — CacheFirst
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname === "/" || url.pathname === "/timeline",
      handler: new CacheFirst({
        cacheName: "app-shell",
        plugins: [
          new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
    // Diary entries API — NetworkFirst
    {
      matcher: /\/api\/entries.*/,
      handler: new NetworkFirst({
        cacheName: "diary-api",
        plugins: [
          new ExpirationPlugin({ maxAgeSeconds: 60 * 60, maxEntries: 50 }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
    // Images (R2) — NetworkOnly (presigned URLs are time-sensitive)
    {
      matcher: /\/api\/image.*/,
      handler: new NetworkOnly(),
    },
    // Static assets — StaleWhileRevalidate
    {
      matcher: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Other API — NetworkOnly
    {
      matcher: /\/api\/.*/,
      handler: new NetworkOnly(),
    },
    // Fonts — CacheFirst
    {
      matcher: /\.(?:woff2?|ttf|otf)$/,
      handler: new CacheFirst({
        cacheName: "fonts",
        plugins: [
          new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
