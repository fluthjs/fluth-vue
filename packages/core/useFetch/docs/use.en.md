# Usage

## Basic Usage

The useFetch function can be used by simply providing a URL. The URL can be a string or a ref. The data object will contain the result of the request, the error object will contain any error information, and the loading object will indicate whether the request is loading.

```ts
import { useFetch } from "fluth-vue";

const { loading, error, data } = useFetch(url);
```

## Async Usage

useFetch can also be awaited like a normal fetch. Note that when a component is async, any component using it must be wrapped with `<Suspense>` tags. You can learn more about the suspense API in the [Vue 3 official documentation](https://vuejs.org/guide/built-ins/suspense.html).

```ts
import { useFetch } from "fluth-vue";

const { loading, error, data } = await useFetch(url);
```

## Refetch on URL Change

Using a `ref` as the url parameter will allow the useFetch function to automatically trigger another request when the url changes.

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true });

url.value = "https://my-api.com/user/2"; // Will trigger another request
```

## Prevent Request from Firing Immediately

Setting the immediate option to false will prevent the request from firing immediately until the execute function is called.

```ts
const { execute } = useFetch(url, { immediate: false });

execute();
```

## Aborting Requests

The `abort` function from the useFetch function can be used to abort the request. The `canAbort` property indicates whether the request can be aborted.

```ts
const { abort, canAbort } = useFetch(url);

setTimeout(() => {
  if (canAbort.value) abort();
}, 100);
```

You can also automatically abort requests by using the `timeout` property. When the specified timeout is reached, it will call the `abort` function.

```ts
const { data } = useFetch(url, { timeout: 100 });
```

## Intercepting Requests

The `beforeFetch` option can intercept the request before it is sent and modify the request options and URL.

```ts
const { data } = useFetch(url, {
  async beforeFetch({ url, options, cancel }) {
    const myToken = await getMyToken();

    if (!myToken) cancel();

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${myToken}`,
    };

    return {
      options,
    };
  },
});
```

The `afterFetch` option can intercept the response data before the response data is updated.

```ts
const { data } = useFetch(url, {
  afterFetch(ctx) {
    if (ctx.data.title === "HxH") ctx.data.title = "Hunter x Hunter"; // Modify response data

    return ctx;
  },
});
```

When `updateDataOnError` is set to `true`, the `onFetchError` option can intercept response data and errors before updating.

```ts
const { data } = useFetch(url, {
  updateDataOnError: true,
  onFetchError(ctx) {
    // When receiving a 5xx response, ctx.data may be null
    if (ctx.data === null) ctx.data = { title: "Hunter x Hunter" }; // Modify response data

    ctx.error = new Error("Custom error"); // Modify error
    return ctx;
  },
});

console.log(data.value); // { title: 'Hunter x Hunter' }
```

## Setting Request Method and Return Type

The request method and return type can be set by adding the appropriate method after useFetch

```ts
// Request will be sent using GET method, data will be parsed as JSON
const { data } = useFetch(url).get().json();

// Request will be sent using POST method, data will be parsed as text
const { data } = useFetch(url).post().text();

// Or set the method using options

// Request will be sent using GET method, data will be parsed as blob
const { data } = useFetch(url, { method: "GET" }, { refetch: true }).blob();
```

## Creating Custom Instances

The `createFetch` function will return a useFetch function with pre-configured options. This is useful for interacting with APIs throughout the application that use the same base URL or require authorization headers.

```ts
const useMyFetch = createFetch({
  baseUrl: "https://my-api.com",
  options: {
    mode: "cors",
    async beforeFetch({ options }) {
      const myToken = await getMyToken();
      options.headers.Authorization = `Bearer ${myToken}`;

      return { options };
    },
  },
});

const { loading, error, data } = useMyFetch("users");
```

If you want to control the behavior of `beforeFetch`, `afterFetch`, `onFetchError` between the pre-configured instance and the newly generated instance, you can provide a `combination` option to switch between `overwrite` or `chaining`.

```ts
const useMyFetch = createFetch({
  baseUrl: "https://my-api.com",
  combination: "overwrite",
  options: {
    // The beforeFetch in the pre-configured instance will only run when the newly generated instance doesn't pass beforeFetch
    async beforeFetch({ options }) {
      const myToken = await getMyToken();
      options.headers.Authorization = `Bearer ${myToken}`;

      return { options };
    },
  },
});

// Using useMyFetch's beforeFetch
const { loading, error, data } = useMyFetch("users");

// Using custom beforeFetch
const { loading, error, data } = useMyFetch("users", {
  async beforeFetch({ url, options, cancel }) {
    const myToken = await getMyToken();

    if (!myToken) cancel();

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${myToken}`,
    };

    return {
      options,
    };
  },
});
```

## Events

`onFetchResponse` and `onFetchError` will be triggered when fetch request responses and errors occur respectively.

```ts
const { onFetchResponse, onFetchError } = useFetch(url);

onFetchResponse((response) => {
  console.log(response.status);
});

onFetchError((error) => {
  console.error(error.message);
});
```
