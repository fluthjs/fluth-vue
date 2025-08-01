# Motivation

## Frontend Business Model

In the field of Web development, the core responsibility of backend services is to receive requests, process them, and return responses. From a system modeling perspective, this is a typical single-input, single-output processing flow.

This characteristic makes backend service logic naturally suitable for abstraction as an Onion Model: outer middleware wraps inner middleware, requests penetrate through each layer of middleware in sequence to reach the core business processing logic, then return responses layer by layer. Common middleware includes authentication, permission validation, logging, caching, etc.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

However, the business model of Web frontend is fundamentally different. Frontend applications run in user browsers as essentially a complex reactive system with multiple inputs and outputs. They directly face user interaction, with extremely diverse input sources: user operations (clicks, input, scrolling), system events (window changes, timer triggers), network responses (API calls, WebSocket messages), etc. These events are unpredictable in the time dimension and completely heterogeneous in frequency, constituting a **highly asynchronous, event-driven** execution environment.

Meanwhile, frontend systems also produce complex and diverse outputs, no longer limited to one-time response returns, but continuously and dispersedly acting on multiple targets. Typical outputs include: DOM updates (reflecting state changes), visual feedback (animations, transition effects), network communication (API requests, data submission), state synchronization (cache updates, local storage), system integration (clipboard, notifications, file system and other browser APIs), etc. These output operations typically adopt a **dynamic distribution, asynchronous execution** mode.

This complex multi-input multi-output pattern forms a fundamental difference from the traditional backend service's "request-response" single output pattern.

## Evolution of Frontend Frameworks

To cope with the **highly asynchronous, event-driven, multi-input multi-output** complex environment in frontend applications, the frontend development community has gradually evolved programming paradigms based on frameworks, among which the most representative is the MVVM (Model-View-ViewModel) architectural pattern.

The core idea of this paradigm is: decoupling the display logic and state logic of pages, and making them automatically coordinate through **reactive binding**.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

In the MVVM model:

- **View** represents the user interface (UI), which is the frontend presentation layer for user interaction.
- **Model** carries data and business state, serving as the core information source for system operation.
- **ViewModel** is the bridge connecting View and Model. It's responsible for "transforming" data from Model into the format needed by the view, while monitoring user operations and updating the Model.

The greatest advantage of MVVM frameworks lies in: when the Model changes, the View automatically updates; conversely, when users operate the View, it can also automatically reflect on the Model.

The essence of this "automatic synchronization" mechanism is a declarative reactive programming paradigm. Developers are liberated from imperative event handling and DOM operations, focusing instead on describing "the mapping relationship from state to view", leaving specific event listening, dependency tracking, DOM updates and other low-level details to the framework.

With this model, frontend frameworks can efficiently organize multi-source inputs from users, networks, timers, etc., and trigger multi-channel outputs such as UI rendering, state updates, and logic calls in a structured manner, making the originally chaotic asynchronous interaction logic stably managed by the framework layer.

## Complex Business Architecture Layering

Although modern frontend frameworks are very mature in handling data changes to view updates, as business complexity grows exponentially, the native programming paradigms of frameworks gradually expose architectural limitations. Mainstream frontend frameworks generally adopt a development model centered on components with Hooks/Composition API as granularity, tightly coupling business logic within components.

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

After business models are extracted from components, components transform into **controlled components**, focusing on data presentation and user interaction, with business logic handled by an independent model layer. The core problem faced at this point is: how to effectively organize and manage these business models after departing from the Vue/React component system?

## Model-Driven and Streams

When constructing business models, highly cohesive logic is typically extracted to form Models. Models are the core of business models, carrying the core data and logic of the business:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

Theoretically, business models are encapsulations of highly cohesive data and logic, and traditional OOP object-oriented programming seems to be a natural choice. However, frontend business models have **highly asynchronous, event-driven, multi-input multi-output** characteristics, and using traditional OOP encapsulation would result in numerous complex asynchronous call chains and callback nesting.

These call chains **execute asynchronously and often span multiple business domains**, greatly increasing the cost of code understanding and maintenance. Although Vue's reactive system simplifies data binding, it may exacerbate problems in complex business scenarios: the trigger points of data modifications are difficult to locate, the propagation paths of side effects are unpredictable, and the overall data flow becomes difficult to trace and debug.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

At this point, if we organize these business models in the form of streams, we can transform these call chains into a stream. The stream form can effectively solve the above problems:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

Streams are a **declarative high-level abstraction of asynchronous programming**. Through the combination of stream operators, complex asynchronous orchestration can be elegantly handled, fundamentally solving the complexity problems of traditional callbacks and Promise chain calls.

In stream architecture, each node is both a data container and a processing unit. The traditional Data and Methods concepts in business models can be unified as stream nodes, achieving integrated management of data and logic:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

Frontend business models based on streams perfectly match the **highly asynchronous, event-driven, multi-input multi-output** essential characteristics of modern frontend applications, providing more elegant and maintainable solutions in both data management and business logic organization.

## Stream Implementation in Frameworks

[RxJS](https://rxjs.dev/) is a typical representative of stream programming. It is very powerful and provides rich stream operators that can handle complex asynchronous logic. However, RxJS has many concepts, a steep learning curve, and is relatively complex to use, making it unsuitable as the infrastructure for streams.

Promise is the most commonly encountered asynchronous stream programming paradigm in frontend development. It is very simple to use, but as a stream form, it can only push data once. Fluth adopts a Promise-like stream programming paradigm, greatly reducing the threshold for stream programming and allowing the stream programming paradigm to serve as the infrastructure for frontend business models.

In addition to reducing the mental burden of stream programming, Fluth also saves the data processed by logic for each stream node, allowing stream nodes to carry both logic and data, and become the basic units of business models.

After adopting Fluth streams to organize business models, the key issue is how to achieve seamless integration between streams and frontend frameworks. Specifically, it needs to solve bidirectional conversion problems:

- For Vue, reactive data can be converted to streams through the [to$](/cn/useFluth/to$.html) method

- For Fluth, streams can be converted to Vue reactive data through methods like [toComp](/cn/useFluth/toComp.html), [toComps](/cn/useFluth/toComps.html), so that frameworks can directly consume stream data

- If pages only need to render stream data, the [render$](/cn/useFluth/render$.html) directive can be used to responsively render stream data bypassing the framework, without triggering component updates

## Example

Below is a simple example — an order form submission page, demonstrating the application of streams in business models:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

Traditional frontend development adopts imperative programming patterns:

1. After clicking the button, call the handleSubmit method
2. handleSubmit first calls validateForm method, if validation fails, show error message
3. If validation passes, assemble data needed by backend
4. Call backend fetchAddOrderApi method
5. If call succeeds, continue to call handleDataB method, handleDataC method
6. If call fails, show error message

This imperative development pattern mixes synchronous logic and asynchronous operations, with poor code readability. As business complexity grows, the handleSubmit method becomes increasingly bloated, forming a typical "God method" anti-pattern.

Below is a reimplementation using streams:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>

Stream programming can elegantly solve these problems: abstracting basic data into independent streams, building business logic through composite operators, with clear code structure, atomized logic, and strong reusability.

Any node in a stream can be branched again for parallel logic processing, and different branches can be merged through operators. Each logic path is clearly visible and composable, maximizing logic reuse.

For modules B and C, their data and the behavior that triggers data modification (addOrder$) are all in the same file. There's no longer a need to search globally for where calls change the module's internal data. Streams enable dependency inversion, greatly improving code readability.

It's worth noting that operators like [audit](https://fluthjs.github.io/fluth-doc/cn/api/operator/audit.html), [debounce](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html), [filter](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html) handle complex asynchronous control logic such as triggers, throttling, and conditional filtering in a declarative manner, significantly improving code expressiveness and maintainability.

Through this comparative case, we can see that stream programming paradigms naturally align with the asynchronous, event-driven characteristics of frontend business, making it an ideal choice for organizing complex frontend business logic.
