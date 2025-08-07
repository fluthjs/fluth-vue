/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, ref, h } from "vue";
import { $, effect$ } from "../../core/useFluth/index";

import "./index.scss";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order = ref({ item: "", price: 0, count: 0 });

    return effect$(() => (
      <div class="card-light" key={Date.now()}>
        <div> example component </div>
        <div>render time: {Date.now()}</div>
        <section style={{ display: "flex", justifyContent: "space-between" }}>
          {/* use$ emit data only trigger render content update*/}
          {user$.render$((v) => (
            <div key={Date.now()} class="card">
              <div>user$ render</div>
              <div>name：{v.name}</div>
              <div>age：{v.age}</div>
              <div>address：{v.address}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
          <div key={Date.now()} class="card">
            <div>order ref render</div>
            <div>item：{order.value.item}</div>
            <div>price：{order.value.price}</div>
            <div>count：{order.value.count}</div>
            <div>render time: {Date.now()}</div>
          </div>
        </section>

        <div class="operator">
          <button
            class="immutable-button "
            onClick={() => user$.set((v) => (v.age += 1))}
          >
            update user$ age
          </button>
          <button
            class="immutable-button"
            onClick={() => (order.value.count += 1)}
          >
            update order count
          </button>
        </div>
      </div>
    ));
  },
  {
    name: "MixRender",
  },
);
