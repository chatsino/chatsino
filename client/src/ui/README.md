# UI

- The **ui/** directory acts as the internal UI library utilized by various routes.
- By isolating visual-themed elements away from routes, there can be some small separation of logic and view, but this isn't a hard-and-fast rule -- it's still okay for routes to have some small self-contained components here and there.
- Anything with complexity or involved UI logic is better suited in the **ui/** directory.
- Note: it is okay for files inside of **ui/** to utilize any hooks -- this isn't aiming to be an externally-used component library.

## Re-exporting Ant Design

- For convenience, **ui/** re-exports `antd` and `@antd/icons` in its `index.ts` file.
- Any files outside of **ui/** can utilize Ant Design components by importing from **ui/**
- Any files within **ui/** should import from `antd` and `@antd/icons` as normal.
