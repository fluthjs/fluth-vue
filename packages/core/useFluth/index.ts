import { Stream as _Stream } from "fluth";
import { onScopeDispose, getCurrentScope } from "vue-demi";

export * from "fluth";

export class Stream extends _Stream {
  constructor() {
    const streamInstance = super() as unknown as _Stream;
    streamInstance.plugin.then.push((unsubscribe) => {
      if (getCurrentScope()) onScopeDispose(unsubscribe);
    });
    return streamInstance;
  }
}
