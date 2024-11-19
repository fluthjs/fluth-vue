# Quick Start

## Installation

```bash
pnpm install fluth-vue
```

## Usage

Import and use fluth-vue in your Vue project:

```ts
import { useFetch, Stream } from "fluth-vue";

const promise$ = new Stream();

const { loading, error, data } = useFetch(url);
```
