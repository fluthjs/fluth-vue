# Condition Control

## Type

```typescript
condition?:
  | MaybeRefOrGetter<boolean>
  | Observable<boolean>
  | Stream<boolean>
  | (() => boolean)
```

- **Default**: `true`

## Usage

Control whether useFetch makes a request through the condition parameter. Requests will only execute when the condition is true.

### Basic Usage

```ts
// Boolean literal
const { data } = useFetch(url, { condition: true });

// Reactive reference
const shouldFetch = ref(false);
const { data } = useFetch(url, { condition: shouldFetch });

// Computed property
const payload = ref({ id: 1 });
const condition = computed(() => !!payload.value.id);
const { data } = useFetch(url, { refetch: true, condition })
  .get(payload)
  .json();

// Function
const { data } = useFetch(url, {
  condition: () => userStore.isLoggedIn && userStore.hasPermission,
});

// Observable/Stream
const condition$ = $(false);
const { data } = useFetch(url, { condition: condition$ });
```

### Dynamic Control

```ts
payload.value.id = 2; // ✅ Will trigger request (condition is true)
payload.value.id = null; // ❌ Will not trigger request (condition is false)
```

::: warning Note
The condition applies to all of the following operations:

- Reactive updates refetch
- Auto refresh refresh
- Manual execution execute
- Initial request immediate
  :::

## Return Value

When condition is false, the execute() method returns Promise.resolve(null) without making an actual network request.
