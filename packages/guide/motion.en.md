# Motivation

## Frontend Business Model

In the field of Web development, the core responsibility of backend services is to receive, process, and respond to requests. From a system modeling perspective, this is a typical single-input, single-output processing flow.

This characteristic makes backend service logic naturally suitable for abstraction as an Onion Model: outer middleware wraps inner middleware, requests penetrate through each layer of middleware in sequence to reach the core business processing logic, then return responses layer by layer. This programming paradigm is most suitable for the business model of backend services.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

However, the business model of Web frontend is fundamentally different. Frontend applications run in user browsers as essentially a complex reactive system with multiple inputs and outputs. They directly face user interaction, with extremely diverse input sources: user operations (clicks, input, scrolling), system events (window changes, timer triggers), network responses (API calls, WebSocket messages), etc. These events are unpredictable in the time dimension and completely heterogeneous in frequency, constituting a **highly asynchronous, event-driven** execution environment.

Meanwhile, frontend systems also produce complex and diverse outputs, no longer limited to one-time response returns, but continuously and dispersedly acting on multiple targets. Typical outputs include: DOM updates (reflecting state changes), visual feedback (animations, transition effects), network communication (API requests, data submission), state synchronization (cache updates, local storage), etc.

The complex input and output patterns of frontend form a stark contrast with the single-input single-output of backend services. What should the frontend programming paradigm be?

## Evolution of Frontend Frameworks

To cope with the **highly asynchronous, event-driven, multi-input multi-output** complex environment in frontend applications, the frontend development community has gradually evolved programming paradigms based on frameworks, among which the most representative is the MVVM (Model-View-ViewModel) architectural pattern.

The core idea of this paradigm is: decoupling the display logic and state logic of pages, and making them automatically coordinate through **reactive binding**.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

The greatest advantage of MVVM frameworks lies in: when the Model changes, the View automatically updates; conversely, when users operate the View, it can also automatically reflect on the Model.

This "automatic synchronization" mechanism is essentially a declarative reactive programming paradigm. Developers are liberated from imperative event handling and DOM operations, focusing instead on describing "the mapping relationship from state to view", leaving specific event listening, dependency tracking, DOM updates and other low-level details to the framework.

However, this reactivity only does half the job, that is, the response between VM and V, **it doesn't solve the business model problem, which is how to organize the Model**, but uniformly delegates it to components for encapsulation and processing.

## Complex Business Architecture Layering

As business complexity grows exponentially, framework component-based programming paradigms gradually expose architectural limitations.

Mainstream frontend frameworks generally adopt a development model centered on components with Hooks/Composition API as granularity, tightly coupling business logic within components. **The form of organizing code in Hooks/Composition adopts a class OOP programming paradigm**: abstracting into data + methods to modify data, but different from OOP in that: composition is preferred over inheritance;

Frameworks also support reactive programming for logic, such as watch, useEffect and other methods, but for reading code the experience is very poor, so most developers still adopt imperative programming:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/page.drawio.svg" alt="motion" />
</div>

In this mode, data acquisition and business logic processing are concentrated within components, business functionality is organized through the hierarchical relationships of the component tree, and data and logic paths are passed along the component hierarchy. This architecture works well for small to medium applications, but in enterprise-level complex business scenarios, the following architectural problems arise:

1. **Components become bloated**: Data requests, data transformation, data logic processing are all piled inside components
2. **Code reading difficulty**: Business logic is scattered across various components, requiring understanding business through component chains
3. **Complex communication**: Components are nested layer by layer, communication is very complex and difficult to understand
4. **Difficult troubleshooting**: Locating problems requires investigation through component chains, with very high costs
5. **Unable to reuse**: View differences make data processing and business logic impossible to reuse
6. **Repeated requests**: Component-internal data requests make reusable data difficult to reuse
7. **High complexity**: Data flow presents spiral network calls, affecting everything when one thing changes

From an architectural design perspective, the state of frontend applications is a dynamic combination of data and logic, with URL routing, user interaction, scheduled tasks, HTTP requests and other side effect operations continuously driving state transitions. Therefore, **the UI interface is essentially a snapshot of application state at a specific moment**.

Directly coupling state logic in the view layer is an architectural inversion. The correct approach should be to decouple state management from the view layer, build an independent business model layer, and let the view become a consumer of state:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/ddd.drawio.svg" alt="motion" />
</div>

After business models are extracted from components, components transform into **controlled components**, focusing on data presentation and user interaction, with business logic handled by an independent model layer. The core problem faced at this point is: **how to effectively organize and manage these business models after departing from the Vue/React component system?**

## Model-Driven and Streams

When constructing business models, highly cohesive logic is typically extracted to form modules. Modules are the core of business models, carrying the core data and logic of the business:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

Theoretically, business models are encapsulations of highly cohesive data and logic, and traditional OOP object-oriented programming seems to be a natural choice. However, frontend business models have **highly asynchronous, event-driven, multi-input multi-output** characteristics, and using traditional OOP encapsulation would result in numerous complex asynchronous call chains and callback nesting.

These call chains **execute asynchronously and often span multiple business domains**, greatly increasing the cost of code understanding and maintenance. Although Vue's reactive system simplifies data binding, it may exacerbate problems in complex business scenarios: the trigger points of data modifications are difficult to locate, the propagation paths of side effects are unpredictable, and the overall data flow becomes difficult to trace and debug.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

At this point, if we organize these business models in the form of pipelines, connecting core asynchronous chains through pipelines, we can effectively solve the above problems:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

This pipeline is very suitable for building with streams. Streams are **declarative high-level abstractions of asynchronous programming**. Through the combination of stream operators, complex asynchronous orchestration can be elegantly handled, fundamentally solving the complexity problems of traditional callbacks and asynchronous chain calls.

If streams, in addition to conventional pipeline capabilities, can also carry logic and data, then **the traditional Data and Methods concepts in business models can be unified as stream nodes**, achieving integrated management of data and logic:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

Frontend business models based on streams perfectly match the **highly asynchronous, event-driven, multi-input multi-output** essential characteristics of modern frontend applications, providing more elegant and maintainable solutions in both data management and business logic organization.

## Stream Implementation in Frameworks

[RxJS](https://rxjs.dev/) is a typical representative of stream programming. It is very powerful and provides rich stream operators that can handle complex asynchronous logic. However, RxJS has many concepts, a steep learning curve, and is relatively complex to use, making it unsuitable as the infrastructure for carrying business.

Fluth adopts a Promise-like stream programming paradigm. Promise is the most commonly encountered asynchronous stream programming paradigm in frontend development, and **Promise-like stream programming paradigm greatly reduces the threshold for stream programming**, allowing streams to serve as the most basic logical units in frontend development.

In addition to reducing the mental burden of stream programming, Fluth also saves the data processed by logic for each stream node, allowing stream nodes to carry both logic and data, and become the basic units that can replace ref, reactive reactive data.

For large-scale use and implementation in frameworks, Fluth streams also provide the following capabilities:

### Framework Integration

- For Vue framework, ref, reactive, computed reactive data can be converted to fluth streams through the [to$](/en/useFluth/#to) method. To maintain fluth stream's immutable characteristics, data will be deepCloned before being given to fluth

- For Fluth streams, stream data is reactive data that can be used normally in templates, watch, and computed. You can also use the [toCompt](/en/useFluth/#tocompt) method to convert to computed reactive data, so frameworks can directly consume stream data and view stream data directly through vue-devtools

### Debugging Capabilities

fluth streams use immutable data structures at the bottom layer and provide rich debugging plugins:

- Through the [consoleNode](https://fluthjs.github.io/fluth-doc/en/api/plugin/consoleNode.html) plugin, stream node data can be conveniently printed

- Through the [consoleAll](https://fluthjs.github.io/fluth-doc/en/api/plugin/consoleAll.html) plugin, all stream node data can be conveniently viewed

- Through the [debugNode](https://fluthjs.github.io/fluth-doc/en/api/plugin/debugNode.html) plugin, stream node data can be conveniently debugged and stream node call stacks can be viewed

- Through the [debugAll](https://fluthjs.github.io/fluth-doc/en/api/plugin/debugAll.html) plugin, all stream node data can be conveniently debugged and stream node call stacks can be viewed

These two capabilities allow fluth streams **to be widely used in vue frameworks like ref, reactive reactive data**.

## Example

Below is a simple example — an order form submission page, demonstrating the application of streams in business models:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

Traditional frontend development adopts **imperative programming patterns**:

- After clicking the button, call the handleSubmit method
- handleSubmit first calls validateForm method, if validation fails, show error message
- If validation passes, assemble data needed by backend
- Call backend fetchAddOrderApi method
  - If call succeeds, continue to call handleDataB method, handleDataC method
- If call fails, show error message

This should be the daily routine of most frontend developers, but daily routine doesn't mean it's natural. This imperative development pattern, mixing synchronous logic and asynchronous operations, **as business complexity grows, the handleSubmit method becomes increasingly bloated and increasingly difficult to reuse**.

Below is a reimplementation using streams' **declarative programming approach**:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>

According to business logic, the code is implemented as six streams: form$, trigger$, submit$, validate$, payload$, addOrderApi$, **each stream carries independent logic, and the order of streams is organized according to the real business order**. form$, trigger$ are responsible for converting user input into streams, validate$, addOrderApi$ then pass stream processing results to users.

Through the code, we can discover:

- **Reusability improvement**: After adopting the stream programming paradigm, **logic is fully atomized**, and streams can both **split and merge**, making it easy to logically combine these logical atoms, unprecedentedly improving code reusability
- **Maintainability improvement**: Code is organized from top to bottom according to the real business order. When there's only one handleSubmit method, it may not be obvious, but when business logic becomes complex, organizing code according to business fact order will greatly improve readability and maintainability
- **Expressiveness improvement**: Operators like [audit](https://fluthjs.github.io/fluth-doc/en/api/operator/audit.html), [debounce](https://fluthjs.github.io/fluth-doc/en/api/operator/debounce.html), [filter](https://fluthjs.github.io/fluth-doc/en/api/operator/debounce.html) handle complex asynchronous control logic such as triggers, throttling, conditional filtering in a declarative manner. Through stream operators, code expressiveness is significantly improved.
- **Inversion of control**: Compared to method calls which are a "pull" approach, stream programming paradigm is a "push" approach, allowing data, methods to modify data, and behaviors that trigger data modifications to all be placed in the same folder, no longer needing to search globally for where calls change module internal data.

### Reusability and Maintainability Explanation

For imperative programming, in subsequent iterations of handleSubmit, different scenarios may be needed:

- Scenario A: After successfully calling fetchAddOrderApi, only call handleDataB method
- Scenario B: After successfully calling fetchAddOrderApi, only call handleDataC method

At this point, handleSubmit can only turn scenarios into parameters handled by if-else, and as more and more branch logic emerges, the function gradually bloats. If implemented using stream programming paradigm, this problem can be easily solved:

- If scenarios are streams, they can be easily solved by combining streams

  ```typescript
  // Scenario A stream
  const caseA$ = $();
  addOrderApi$.pipe(audit(caseA$)).then(handleDataB);
  caseA$.next();

  // Scenario B stream
  const caseB$ = $();
  addOrderApi$.pipe(audit(caseB$)).then(handleDataC);
  caseB$.next();
  ```

- If scenarios are data, they can be handled through either splitting or filtering, both approaches can easily solve the problem

  ```typescript
  // Scenario stream, could be A or B
  const case$ = $<"A" | "B">();

  // Method 1: Split streams
  const [caseA$, caseB$] = partition(case$, (value) => value === "A");
  addOrderApi$.pipe(audit(caseA$)).then(handleDataB);
  addOrderApi$.pipe(audit(caseA$)).then(handleDataC);

  // Method 2: Filter
  const caseAA$ = addOrderApi$
    .pipe(filter(case$.value === "A"))
    .then(handleDataB);

  const caseBB$ = addOrderApi$
    .pipe(filter(case$.value === "B"))
    .then(handleDataC);
  ```

## Extension

The above is a simple example. If business logic is complex, in traditional development mode, there might be dozens of refs and dozens of methods under a setup function. If we consider setup as a class, then this class would have dozens of properties and methods as well as ugly watches, with very high reading and maintenance costs.

Although more granular component extraction and hooks development concepts can solve some problems, the reality is that a large amount of existing business is assembled from components constructed by countless such bloated setup functions (heartache for frontend developers), because for various reasons (laziness or lack of mindset), once setup becomes such a bloated class, subsequent developers can only continue to "deeply cultivate" on this setup.

Stream programming paradigm can solve this problem well. As business continues to iterate, code also grows longer; but **stream programming organizes code declaratively according to real business order**, equivalent to a line continuously extending. At this point, to extract logic, you just need to cut the line into several segments and put them into hooks respectively, with no mental burden at all, equivalent to having a very heavy business that only takes a few minutes to solve and refactor well.

Through this example and extension, we can see that **stream programming paradigm naturally aligns with the asynchronous, event-driven characteristics of frontend business, making it an ideal choice for organizing frontend business logic**.
