# Condition

## Usage

You can control whether `useFetch` makes a request using the `condition` parameter

```ts
const payload = ref({ id: 1 });

const condition = computed(() => !!payload.value.id);

const { data } = useFetch(url, { refetch: true, condition }).get(payload).json();

payload.value.id = 2; // Will trigger another request

payload.value.id = null; // Will not trigger another request
```

::: warning Note
The `condition` parameter affects reactive updates (`refetch`), automatic updates (`refresh`), and manual execution (`execute`)
::: 