# Top-Level Files

- Some re-used functionality is specific enough and concise enough that it lives at the top level of **src/**

## config.ts

- Stores configuration values used throughout the application.
- Easy centralized for on-the-fly modifications.

## enums.ts

- A collection of enumerated values matching the contract the server expects.
- This file should be updated whenever the server changes enums for consistency.

## subscriptions.ts

- Contains formatters for each valid socket subscription.
- This file should be updated whenever the server changes subscription names for consistency.
