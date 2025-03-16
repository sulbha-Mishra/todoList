## Problem: Offline-First To-Do App

### Problem Statement

You need to develop a To-Do application in React Native that allows users to:

- Create, edit, and delete tasks.
- Mark tasks as completed or pending.
- Persist data offline using AsyncStorage, so tasks are not lost when the app is closed.
- Sync tasks with a mock API when the device is online (use [JSONPlaceholder Todos](https://jsonplaceholder.typicode.com/todos)).
- Show an indicator when syncing data with the server.

### Functional Requirements

- Add a new task with a title and description.
- Edit or delete an existing task.
- Display tasks in two lists: **"Pending"** & **"Completed"**.
- **Offline mode:**
  - **a.** If offline, tasks should be stored locally in AsyncStorage.
  - **b.** When the app goes online, it should sync new tasks with the API. Show a sync status indicator when syncing.

### Tech Constraints

- Use React Native AsyncStorage for offline persistence.
- Use React Query for API calls (or simple `fetch`).
- UI should use `FlatList` for smooth performance.
