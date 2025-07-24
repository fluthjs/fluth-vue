# Motivation

## Frontend Business Model

In the field of Web development, the core responsibility of Web services is typically to receive requests, process them, and return responses. From a system modeling perspective, this is a single-input, single-output synchronous processing flow.
This makes Web service logic naturally suitable for abstraction as an onion model: outer middleware wraps inner middleware, requests penetrate through each layer of middleware in sequence to reach the core business processing logic, then return responses layer by layer. Common middleware includes authentication, authorization, logging, caching, etc.

<div class="flex flex-col items-center justify-center">
  <img src="/model.drawio.svg" alt="motion" />
</div>

However, the business model of Web frontend is completely different. Frontend pages run in user browsers and constitute a complex system with multiple inputs and multiple outputs. They face direct user interaction, with input sources including user clicks, input, scrolling, window changes, timer triggers, network API responses, etc. These events occur at uncertain times and inconsistent frequencies, creating a `highly asynchronous, event-driven` environment.

Meanwhile, frontend systems also produce diverse outputs. These outputs are no longer limited to one-time responses but continuously and dispersedly feedback to multiple targets. Common outputs include updating DOM structures in pages to reflect state changes, executing animations or transition effects to enhance user experience, sending new API requests to fetch or submit data, modifying local state (such as cache, storage, or component state) to prepare for subsequent interactions, and even interacting with native browser features (like clipboard, notifications, file system, etc.). These outputs are typically delivered through `dynamic dispatch and asynchronous feedback`.

The complex input and output methods form a sharp contrast with the traditional Web service's "request-response" single output pattern.

## Frontend Frameworks

To cope with the highly asynchronous, event-driven, multi-input multi-output complex environment in frontend pages, frontend development has gradually evolved a structured modeling paradigm, with the most representative being the `MVVM (Model-View-ViewModel)` framework. The core idea of this paradigm is to decouple page display logic from state logic and make them automatically coordinate through "reactive binding".

In the MVVM model:

- View represents the user interface (UI), which is the frontend presentation layer for user interaction.
- Model carries data and business state, serving as the core information source for system operation.
- ViewModel is the bridge connecting View and Model. It's responsible for "transforming" data from Model into formats needed by the view, while listening to user operations and updating the Model.

The greatest advantage of MVVM frameworks is:
When the Model changes, the View automatically updates; conversely, when users operate the View, it can automatically reflect to the Model.

This "automatic synchronization" mechanism is essentially a form of declarative reactive programming. Developers no longer need to explicitly organize input events or manually update views, but focus on describing "how state maps to interface", letting the framework handle specific event listening and DOM updates.

With this model, frontend frameworks can efficiently organize multi-source inputs from users, networks, timers, etc., and trigger multi-channel outputs like UI rendering, state updates, logic calls, etc. in a structured way, allowing the originally chaotic asynchronous interaction logic to be stably managed by the framework layer.

## Complex Business Scenarios

Although frontend frameworks excel at handling data changes and updating pages, as business complexity continues to increase, the programming paradigms provided by frameworks can become bottlenecks for business development. Most frontend framework programming paradigms are component-centric, with hooks as granularity, organizing business logic within components.

Placing data requests, logic processing uniformly within components for handling, with data and logic chains progressing layer by layer through the component tree, and functionality organized through components. This seems fine for simple business, but for complex business, the following problems emerge:

1. **Overly bloated components**: Data requests, data transformation, data logic processing all piled up inside components
2. **Difficult code reading**: Business logic scattered across various components, requiring understanding business through component chains
3. **Complex communication**: Components nested layer by layer, communication is very complex and difficult to understand
4. **Difficult positioning**: Problem location requires troubleshooting along component chains, with very high costs
5. **Cannot reuse**: View differences make data processing and business logic unable to reuse
6. **Duplicate requests**: Component internal data requests make reusable data difficult to reuse
7. **High complexity**: Data flow presents spiral network calls, affecting the whole system when touching one part

At this point, abstracting business according to `DDD` Domain-Driven Design thinking is a relatively correct choice. When business models are abstracted from components, components become `controlled`, only consuming data provided by models. So how should we organize business models? Our code is no longer within components, and the programming paradigms provided by `vue` or `react` are no longer applicable. Given the highly asynchronous nature of frontend, using classes to organize business models is not a very good choice at this point.

## TODO...
