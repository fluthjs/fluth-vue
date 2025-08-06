/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, h } from "vue";
import { $, effect } from "../../core/useFluth/index";

import "./index.scss";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    return effect(() => (
      <div class="card-light" key={Date.now()}>
        <div> example component </div>
        <div>render time: {Date.now()}</div>
        <section style={{ display: "flex", justifyContent: "space-between" }}>
          {/* use$ emit data only trigger render content update*/}
          {user$.render((v) => (
            <div key={Date.now()} class="card">
              <div>user$ render</div>
              <div>name：{v.name}</div>
              <div>age：{v.age}</div>
              <div>address：{v.address}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
          {/* order$ emit data only trigger render content update*/}
          {order$.render((v) => (
            <div key={Date.now()} class="card">
              <div>order$ render</div>
              <div>item：{v.item}</div>
              <div>price：{v.price}</div>
              <div>count：{v.count}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
        </section>

        <div class="operator">
          <button
            class="immutable-button"
            onClick={() => user$.set((v) => (v.age += 1))}
          >
            update user$ age
          </button>
          <button
            class="immutable-button"
            onClick={() => order$.set((v) => (v.count += 1))}
          >
            update order$ count
          </button>
        </div>
      </div>
    ));
  },
  {
    name: "StreamingRender",
  },
);
