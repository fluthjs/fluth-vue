<template>
  <div
    style="
      background-color: #292d3e;
      margin: 30px 0;
      padding: 20px;
      border-radius: 8px;
      position: relative;
    "
  >
    <div
      style="
        display: flex;
        justify-content: space-between;
        font-family: var(--vp-font-family-mono);
      "
    >
      <div>
        <span class="line"
          ><span style="color: #f97583">const</span
          ><span style="color: #79b8ff"> fetch</span
          ><span style="color: #f97583"> =</span
          ><span style="color: #b392f0"> useFetch </span
          ><span style="color: #fcaa6f"
            >(<a style="color: #fcaa6f" href="#url">url</a>, fetchOptions)</span
          ></span
        >
      </div>
    </div>
    <div
      style="
        color: #e1e4e8;
        display: flex;
        align-items: flex-start;
        position: relative;
      "
    >
      <ul
        class="fetch"
        style="
          margin-left: 123px;
          cursor: pointer;
          padding-left: 4px;
          border-left: 1px solid #e1e4e8;
          border-radius: 4px;
        "
      >
        <a
          class="type item-function"
          href="#usefetchreturn"
          style="
            position: absolute;
            left: -12px;
            top: 180px;
            background: #292d3e;
            z-index: 1;
          "
        >
          UseFetchReturn
        </a>
        <a
          :class="['item', { 'item-function': item.type === 'function' }]"
          :href="item.address"
          style="display: block"
          v-for="item in streamApi"
          :key="item.name"
        >
          {{ item.name }}
        </a>
      </ul>
    </div>

    <div
      style="
        color: #e1e4e8;
        display: flex;
        align-items: flex-start;
        position: absolute;
        top: 45px;
        right: 130px;
      "
    >
      <ul
        class="options"
        style="
          margin-left: 133px;
          cursor: pointer;
          padding-left: 4px;
          border-left: 1px solid #e1e4e8;
          border-radius: 4px;
        "
      >
        <a
          class="type item-function"
          href="#usefetchoptions"
          style="
            position: absolute;
            left: -5px;
            top: 180px;
            background: #292d3e;
            z-index: 1;
          "
        >
          UseFetchOptions
        </a>
        <a
          :class="['item', { 'item-function': item.type === 'function' }]"
          :href="item.address"
          style="display: block"
          v-for="item in optionsApi"
          :key="item.name"
        >
          {{ item.name }}
        </a>
      </ul>
    </div>
  </div>
</template>

<script setup lang="tsx">
defineOptions({
  name: "stream",
});

const streamApi = [
  {
    name: "data",
    address: "#data",
  },
  {
    name: "loading",
    address: "#loading",
  },
  {
    name: "error",
    address: "#error",
  },
  {
    name: "isFinished",
    address: "#isFinished",
  },
  {
    name: "statusCode",
    address: "#statuscode",
  },
  {
    name: "response",
    address: "#response",
  },

  {
    name: "canAbort",
    address: "#canAbort",
  },
  {
    name: "aborted",
    address: "#aborted",
  },
  {
    name: "promise$",
    address: "#promise",
  },
  {
    name: "execute",
    type: "function",
    address: "#execute",
  },
  {
    name: "abort",
    type: "function",
    address: "#abort",
  },
  {
    name: "cancelRefresh",
    type: "function",
    address: "#cancelrefresh",
  },
  {
    name: "clearCache",
    type: "function",
    address: "#clearcache",
  },

  {
    name: "onFetchResponse",
    type: "function",
    address: "#onfetchresponse",
  },
  {
    name: "onFetchError",
    type: "function",
    address: "#onfetcherror",
  },
  {
    name: "onFetchFinally",
    type: "function",
    address: "#onfetchfinally",
  },
  {
    name: "get",
    type: "function",
    address: "#get",
  },
  {
    name: "post",
    type: "function",
    address: "#post",
  },
  {
    name: "put",
    type: "function",
    address: "#put",
  },
  {
    name: "delete",
    type: "function",
    address: "#delete",
  },
  {
    name: "patch",
    type: "function",
    address: "#patch",
  },
  {
    name: "head",
    type: "function",
    address: "#head",
  },
  {
    name: "options",
    type: "function",
    address: "#options",
  },
  {
    name: "json",
    type: "function",
    address: "#json",
  },
  {
    name: "text",
    type: "function",
    address: "#text",
  },
  {
    name: "blob",
    type: "function",
    address: "#blob",
  },
  {
    name: "arrayBuffer",
    type: "function",
    address: "#arraybuffer",
  },
  {
    name: "formData",
    type: "function",
    address: "#formdata",
  },
];

const optionsApi = [
  {
    name: "initialData",
    address: "#initialdata",
  },
  {
    name: "immediate",
    address: "#immediate",
  },
  {
    name: "condition",
    address: "#condition",
  },
  {
    name: "refetch",
    address: "#refetch",
  },
  {
    name: "refresh",
    address: "#refresh",
  },
  {
    name: "retry",
    address: "#retry",
  },
  {
    name: "cacheSetting",
    address: "#cachesetting",
  },
  {
    name: "debounce",
    address: "#debounce",
  },
  {
    name: "throttle",
    address: "#throttle",
  },
  {
    name: "isFinished",
    address: "#isFinished",
  },
  {
    name: "timeout",
    address: "#timeout",
  },
  {
    name: "fetch",
    address: "#fetch",
  },
  {
    name: "updateDataOnError",
    address: "#updatedataonerror",
  },

  {
    name: "beforeFetch",
    type: "function",
    address: "#beforefetch",
  },
  {
    name: "afterFetch",
    type: "function",
    address: "#afterfetch",
  },
  {
    name: "onFetchError",
    type: "function",
    address: "#onfetcherror",
  },
  {
    name: "...requestInit",
    address: "#requestinit",
  },
];
</script>

<style lang="scss" scoped>
.fetch {
  &::before {
    content: " ";
    position: absolute;
    left: 3px;
    top: -5px;
    display: block;
    width: 110px;
    height: 8px;
    border-bottom: 1px dashed #e1e4e8;
    border-radius: 4px;
  }
  &::after {
    content: " ";
    position: absolute;
    left: 70px;
    top: 5px;
    display: block;
    width: 40px;
    height: 340px;
    border-left: 1px dashed #e1e4e8;
    border-bottom: 1px dashed #e1e4e8;
  }
}

.options {
  &::before {
    content: " ";
    position: absolute;
    left: 30px;
    top: -5px;
    display: block;
    width: 100px;
    height: 8px;
    border-bottom: 1px dashed #e1e4e8;
    border-radius: 4px;
  }
  &::after {
    content: " ";
    position: absolute;
    left: 80px;
    top: 5px;
    display: block;
    width: 50px;
    height: 340px;
    border-left: 1px dashed #e1e4e8;
    border-bottom: 1px dashed #e1e4e8;
  }
}

.item {
  color: #62a9fb;
  &:hover {
    color: #4081cb;
  }
  &-function {
    color: #b392f0;
  }
  &-function:hover {
    color: #987cce;
  }
}
.type {
  font-weight: 600;
  color: #b392f0;
}
</style>
