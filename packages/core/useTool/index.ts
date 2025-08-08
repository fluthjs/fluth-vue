import { getCurrentInstance, type VNode } from "vue";

export function useRender(render: () => VNode): void {
  if (!getCurrentInstance)
    throw new Error("useRender must be called from inside a setup function");
  const vm = getCurrentInstance?.() as any;
  if (!vm) {
    throw new Error("useRender must be called from inside a setup function");
  }
  vm.render = render;
}
