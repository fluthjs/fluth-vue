# Motivation

## Frontend Business Model

In the field of Web development, the core responsibility of Web services is typically to receive requests, process them, and return responses. From a system modeling perspective, it's a single-input, single-output processing flow.
This makes Web service logic naturally suitable for abstraction as an onion model: outer middleware wraps inner middleware, requests penetrate through each layer of middleware in sequence to reach the core business processing logic, then return responses layer by layer. Common middleware includes authentication, permission validation, logging, caching, etc.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

However, the business model of Web frontend is completely different. Frontend pages run in user browsers as a complex system with multiple inputs and outputs. It directly interacts with users, with input sources including user clicks, input, scrolling, window changes, timer triggers, network API responses, etc. These events occur at uncertain times and inconsistent frequencies, creating a **highly asynchronous, event-driven** environment.

Meanwhile, frontend systems also produce diverse outputs. These outputs are no longer limited to one-time response returns, but are continuously and dispersedly fed back to multiple targets. Common outputs include updating DOM structures in pages to reflect state changes, executing animations or transition effects to enhance user experience, sending new API requests to fetch or submit data, modifying local state (such as cache, storage, or component state) to prepare for subsequent interactions, and even interacting with browser native features (such as clipboard, notifications, file system, etc.). These outputs are also typically delivered in a **dynamic distribution, asynchronous feedback** manner.

The complex input and output methods form a sharp contrast with the traditional Web service's "request-response" single output pattern.

## Evolution of Frontend Frameworks

To cope with the **highly asynchronous, event-driven, multi-input multi-output** complex environment in frontend pages, frontend development has gradually evolved programming paradigms relying on various frameworks, among which the most representative is the `MVVM (Model-View-ViewModel)` framework.

The core idea of this paradigm is: decoupling the display logic and state logic of pages, and making them automatically coordinate through **reactive binding**.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

In the MVVM model:

- **View** represents the user interface (UI), which is the frontend presentation layer for user interaction.
- **Model** carries data and business state, serving as the core information source for system operation.
- **ViewModel** is the bridge connecting View and Model. It's responsible for "transforming" data from Model into the format needed by the view, while monitoring user operations and updating the Model.

The greatest advantage of MVVM frameworks lies in:
When the Model changes, the View automatically updates; conversely, when users operate the View, it can also automatically reflect on the Model.

This "automatic synchronization" mechanism is essentially a declarative reactive programming approach. Developers no longer need to explicitly organize input events or manually update views, but focus on describing "how state maps to interface", letting the framework handle specific event listening and DOM updates.

With this model, frontend frameworks can efficiently organize multi-source inputs from users, networks, timers, etc., and trigger multi-channel outputs such as UI rendering, state updates, and logic calls in a structured manner, making the originally chaotic asynchronous interaction logic stably managed by the framework layer.

## Complex Business Architecture Layering

Although frontend frameworks excel at handling data changes and updating pages, as business complexity continues to increase, the programming paradigms provided by frameworks can become bottlenecks for business. Most frontend framework programming paradigms are component-centric, with hooks as granularity, organizing business logic within components.

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/page.drawio.svg" alt="motion" />
</div>

Placing data requests and logic processing uniformly in components for handling, with data and logic chains progressing layer by layer through the component tree, and functionality organized through components. This approach seems fine for simple businesses, but for complex businesses, the following problems become exposed:

1. **Components become bloated**: Data requests, data transformation, data logic processing are all piled inside components
2. **Code reading difficulty**: Business logic is scattered across various components, requiring understanding business through component chains
3. **Complex communication**: Components are nested layer by layer, communication is very complex and difficult to understand
4. **Difficult troubleshooting**: Locating problems requires investigation through component chains, with very high costs
5. **Unable to reuse**: View differences make data processing and business logic impossible to reuse
6. **Repeated requests**: Component-internal data requests make reusable data difficult to reuse
7. **High complexity**: Data flow presents spiral network calls, affecting everything when one thing changes

If we consider frontend state as the sum of a series of data and logic, then URL changes, DOM element operations, timers, HTTP requests, and other side effects cause state to constantly change dynamically. **The interface is actually a slice of state at a certain moment**.

Putting state directly into the interface is putting the cart before the horse. Extracting state from the view layer to construct a business model, with views consuming state, aligns with the above concept:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/ddd.drawio.svg" alt="motion" />
</div>

When business models are extracted from components, components become **controlled**, only consuming data provided by the model. So how should we organize business models? Our code is no longer within components, and the programming paradigms provided by `Vue` or `React` are no longer applicable.

## Model-Driven and Streams

When constructing business models, highly cohesive logic is typically extracted to form Models. Models are the core of business models, carrying the core data and logic of the business:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

Essentially, models are collections of highly cohesive data and logic. It might seem that directly using `OOP` object-oriented encapsulation could achieve the goal, but as mentioned earlier, frontend business models are **highly asynchronous, event-driven, multi-input multi-output**. Using `OOP` for encapsulation would result in numerous asynchronous call chains.

These call chains, being **asynchronous and often spanning multiple business models**, make code difficult to read and maintain. Moreover, `Vue`'s data reactivity often exacerbates this problem - data gets modified at unknown points, and modifications may unknowingly trigger other logic, making data flow difficult to trace:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

At this point, if we organize these business models in the form of streams, we can transform these call chains into a stream. The stream form can well solve the above problems:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

Streams are a **declarative high-level abstraction of asynchronous programming**. Through streams and operators, very complex asynchronous orchestration can be completed, thus breaking free from traditional complex call logic relationships.

When each node of a stream can both store data and process data, the `Data` and `Methods` of business models can also be discarded, all organized in the form of stream nodes:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

This frontend business model based on streams perfectly fits the **highly asynchronous, event-driven, multi-input multi-output** characteristics of frontend business models. It can both organize business data well and organize business logic well.

## Stream Implementation in Frameworks

Using streams to organize business models ultimately requires converting stream-processed results into data consumable by frontend frameworks:

1. How streams are converted into data consumable by frontend frameworks
2. How streams are converted into logic consumable by frontend frameworks

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>
