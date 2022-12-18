# Updater Hooks

- In the context of Chatsino, "updater hooks" are hooks that merge the functionality of HTTP and WebSockets.
- Each updater initially receives data from a `react-router-dom` loader and stores it in local state.
- Next, the updater subscribes to broadcasted WebSocket events that change the stored data.
- The result is an initial fetch of a potentially larger dataset and then incremental updates throughout the lifetime of the parent component.
