# Quick Start

## Installation

```bash
pnpm install fluth-vue
# or
npm install fluth-vue
# or
yarn add fluth-vue
```

## Core Concepts

Fluth-Vue is a Vue composition utility library based on stream programming, providing powerful HTTP request management and reactive data flow processing capabilities. Core concepts include:

- **Stream**: Stream data container that can push data multiple times
- **useFetch**: Powerful HTTP request hook with support for caching, retry, debounce, and more
- **Conversion Tools**: Bidirectional conversion between Vue reactive data and Streams

## Basic Usage

### 1. HTTP Requests

```ts
import { useFetch } from "fluth-vue";

// Basic usage
const { loading, error, data } = useFetch("https://api.example.com/users");

// Manual execution
const { execute, loading, data } = useFetch("/api/users", {
  immediate: false,
});

// Execute request
await execute();
```

### 2. Different HTTP Methods

```ts
// GET request (default)
const { data } = useFetch("/api/users").get();

// POST request
const { data, execute } = useFetch("/api/users", {
  immediate: false,
}).post({ name: "John", age: 25 });

// PUT request
const { data } = useFetch("/api/users/1").put({ name: "Jane" });

// DELETE request
const { data } = useFetch("/api/users/1").delete();
```

### 3. Response Data Types

```ts
// JSON response (default is text)
const { data } = useFetch("/api/users").json();

// Text response
const { data } = useFetch("/api/users").text();

// Blob response
const { data } = useFetch("/api/file").blob();
```

### 4. Stream Programming

```ts
import { $, toComp, to$ } from "fluth-vue";
import { ref } from "vue";

// Create stream
const name$ = $("initial value");

// Convert stream to Vue reactive data
const nameRef = toComp(name$);

// Convert Vue reactive data to stream
const count = ref(0);
const count$ = to$(count);

// Listen to stream changes
name$.then((value) => {
  console.log("Name changed:", value);
});

// Push new data
name$.next("new name");
```

### 5. Advanced Features

#### Caching

```ts
const { data, clearCache } = useFetch("/api/users", {
  cacheSetting: {
    cacheResolve: ({ url }) => url, // Cache key
    expiration: 60000, // Cache expiration time (milliseconds)
  },
});

// Clear cache
clearCache();
```

#### Retry

```ts
const { data } = useFetch("/api/unstable-endpoint", {
  retry: 3, // Retry 3 times on failure
});
```

#### Debounce and Throttle

```ts
// Debounce: Only execute the last request within 300ms
const { execute } = useFetch("/api/search", {
  immediate: false,
  debounce: 300,
});

// Throttle: Execute at most once every 300ms
const { execute } = useFetch("/api/data", {
  immediate: false,
  throttle: 300,
});
```

#### Conditional Requests

```ts
const enabled = ref(true);

const { data } = useFetch("/api/data", {
  condition: () => enabled.value, // Only make request when enabled is true
});
```

#### Periodic Refresh

```ts
const { data, cancelRefresh } = useFetch("/api/live-data", {
  refresh: 5000, // Refresh every 5 seconds
});

// Cancel periodic refresh
cancelRefresh();
```

## Complete Examples

### User List Management

```vue
<template>
  <div>
    <h2>User List</h2>

    <!-- Search input -->
    <input
      v-model="searchTerm"
      placeholder="Search users..."
      @input="handleSearch"
    />

    <!-- Loading state -->
    <div v-if="loading">Loading...</div>

    <!-- Error message -->
    <div v-if="error" class="error">{{ error }}</div>

    <!-- User list -->
    <ul v-if="data">
      <li v-for="user in data" :key="user.id">
        {{ user.name }} - {{ user.email }}
        <button @click="deleteUser(user.id)">Delete</button>
      </li>
    </ul>

    <!-- Add user form -->
    <form @submit.prevent="addUser">
      <input v-model="newUser.name" placeholder="Name" required />
      <input v-model="newUser.email" placeholder="Email" required />
      <button type="submit" :disabled="adding">
        {{ adding ? "Adding..." : "Add User" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useFetch } from "fluth-vue";

// Search related
const searchTerm = ref("");

// Get user list (with cache and debounced search)
const {
  loading,
  error,
  data,
  execute: searchUsers,
} = useFetch("/api/users", {
  immediate: true,
  debounce: 300,
  cacheSetting: {
    cacheResolve: ({ url }) => url,
    expiration: 30000, // 30 seconds cache
  },
}).json();

// Add user
const newUser = reactive({ name: "", email: "" });
const { loading: adding, execute: addUserRequest } = useFetch("/api/users", {
  immediate: false,
}).post();

// Delete user
const { execute: deleteUserRequest } = useFetch(
  (id: string) => `/api/users/${id}`,
  {
    immediate: false,
  },
).delete();

// Search handler
const handleSearch = () => {
  const params = searchTerm.value ? { q: searchTerm.value } : {};
  searchUsers(params);
};

// Add user
const addUser = async () => {
  try {
    await addUserRequest(newUser);
    // Reset form
    newUser.name = "";
    newUser.email = "";
    // Refresh list
    searchUsers();
  } catch (error) {
    console.error("Failed to add user:", error);
  }
};

// Delete user
const deleteUser = async (id: string) => {
  try {
    await deleteUserRequest();
    // Refresh list
    searchUsers();
  } catch (error) {
    console.error("Failed to delete user:", error);
  }
};
</script>
```

### Stream Data Processing

```vue
<template>
  <div>
    <h2>Real-time Counter</h2>

    <!-- Directly render stream data -->
    <p>Current count: <span v-render$="count$">0</span></p>

    <!-- Render through Vue reactive data -->
    <p>Double count: {{ doubleCount }}</p>

    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="reset">Reset</button>
  </div>
</template>

<script setup lang="ts">
import { $, toComp, render$ } from "fluth-vue";

// Create stream
const count$ = $(0);

// Convert stream to Vue reactive data
const count = toComp(count$);
const doubleCount = toComp(count$.then((value) => value * 2));

// Operation methods
const increment = () => count$.next(count$.value + 1);
const decrement = () => count$.next(count$.value - 1);
const reset = () => count$.next(0);

// Register directive
app.directive("render$", render$);
</script>
```

## Next Steps

Now that you understand the basic usage of Fluth-Vue, you can check out the following documentation for deeper understanding:

- [Detailed API Documentation](/api/)
- [Caching Mechanism](/useFetch/cache)
- [Conditional Requests](/useFetch/condition)
- [Debounce and Throttle](/useFetch/debounce)
- [Retry Mechanism](/useFetch/retry)
- [Stream Programming Guide](/useFluth/)
