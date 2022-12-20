# Caching

- Chatsino utilizes Redis to handle caching functionality.
- **cache.ts** is where setup and teardown are defined, as well as composable functions for basic caching.
- **entities.ts** is the central location for entity-based caching configuration. Each entry contains methods for caching, reading and clearing data.
- **keys.ts** contains key formatters for storage and messaging.
