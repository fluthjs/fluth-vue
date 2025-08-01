# 动机

## 前端业务模型

在 Web 开发领域中，后端服务的核心职责是接收请求、处理请求并返回响应。从系统建模的角度来看，这是一个典型的单输入单输出处理流程。

这种特性使得后端服务的逻辑天然适合抽象为洋葱模型（Onion Model）：外层中间件包裹内层中间件，请求按顺序穿透各层中间件进入核心业务处理逻辑，再逐层返回响应。常见的中间件包括身份验证、权限校验、日志记录、缓存处理等。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

而 Web 前端的业务模型与此截然不同。前端应用运行在用户浏览器中，本质上是一个多输入多输出的复杂响应式系统。它直接面向用户交互，输入来源极其多样化：用户操作（点击、输入、滚动）、系统事件（窗口变化、定时器触发）、网络响应（API 调用、WebSocket 消息）等。这些事件在时间维度上不可预测，频率完全异构，构成了一个**高度异步、事件驱动**的执行环境。

与此同时，前端系统的输出同样复杂多样，不再局限于一次性的响应返回，而是持续、分散地作用于多个目标。典型的输出包括：DOM 更新（反映状态变化）、视觉反馈（动画、过渡效果）、网络通信（API 请求、数据提交）、状态同步（缓存更新、本地存储）、系统集成（剪贴板、通知、文件系统等浏览器 API）等。这些输出操作通常采用**动态分发、异步执行**的模式。

复杂的输入和输出方式，与传统 Web 服务的“请求-响应”式单一输出形成鲜明对比。

## 前端框架的演化

为了应对前端应用中**高度异步、事件驱动、多输入多输出**的复杂环境，前端开发社区逐步演化出基于框架的编程范式，其中最具代表性的是 `MVVM（Model-View-ViewModel）` 架构模式。

这一范式的核心思想是：将页面的显示逻辑与状态逻辑解耦，并通过**响应式绑定**让它们自动协同。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

在 MVVM 模型中：

- View（视图） 代表用户界面（UI），它是用户交互的前端展现层。
- Model（模型） 承载了数据与业务状态，是系统运行的核心信息源。
- ViewModel 是连接 View 和 Model 的桥梁，它负责将 Model 中的数据“转换”为视图需要的格式，同时监听用户操作并更新 Model。

MVVM 框架的最大优势在于：当 Model 发生变化时，View 会自动更新；反之，用户操作 View 时，也能自动反映到 Model 上。

这一“自动同步”机制，本质上是一种声明式响应式编程。开发者不再需要显式地组织输入事件、手动更新视图，而是专注于描述“状态如何映射为界面”，让框架负责具体的事件监听和 DOM 更新。

借助这一模型，前端框架能够高效地组织来自用户、网络、定时器等多源输入，并以结构化的方式触发 UI 渲染、状态更新、逻辑调用等多通道输出，使得原本混乱的异步交互逻辑被框架层稳定接管。

## 复杂业务架构分层

虽然现代前端框架在数据变化到视图更新的处理上已经非常成熟，但随着业务复杂度的指数级增长，框架原生的编程范式逐渐暴露出架构层面的局限性。主流前端框架普遍采用以组件为核心、以 Hooks/Composition API 为颗粒度的开发模式，将业务逻辑内聚在组件内部。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/page.drawio.svg" alt="motion" />
</div>

在这种模式下，数据获取和业务逻辑处理都集中在组件内部，业务功能通过组件树的层级关系进行组织，数据和逻辑链路沿着组件层次结构传递。这种架构对于中小型应用运行良好，但在企业级复杂业务场景下，会产生以下架构性问题：

1. **组件过于臃肿**：数据的请求、数据的转换、数据的逻辑处理、全部堆在组件内部
2. **代码阅读困难**：业务逻辑散落在各个组件中，需按照组件链条来理解业务
3. **通信复杂**：组件层层嵌套，通信非常复杂，也难以理解
4. **定位困难**：定位问题需要按照组件链条来排查，成本非常高
5. **无法复用**：视图的差异性导致数据处理和业务逻辑无法复用
6. **重复请求**：组件内部请求数据导致可以复用的数据难以复用
7. **复杂度高**：数据流呈现螺旋网状调用，牵一发而动全身

从架构设计角度来看，前端应用的状态是数据和逻辑的动态组合体，URL 路由、用户交互、定时任务、HTTP 请求等副作用操作持续驱动状态变迁。因此，**UI 界面本质上是应用状态在特定时刻的快照**。

将状态逻辑直接耦合在视图层是一种架构上的倒置，正确的做法应该是将状态管理从视图层解耦，构建独立的业务模型层，让视图成为状态的消费者：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/ddd.drawio.svg" alt="motion" />
</div>

业务模型从组件中抽离后，组件转变为**受控组件**，专注于数据展示和用户交互，业务逻辑由独立的模型层负责。此时面临的核心问题是：在脱离了 Vue/React 组件体系后，如何有效地组织和管理这些业务模型？

## 模型驱动与流

在构造业务模型的时候，通常会将功能高度内聚的 logic 抽离出来组成 Model，Model 是业务模型的核心，它承载了业务的核心数据和逻辑:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

从理论上讲，业务模型是高内聚的数据和逻辑的封装体，传统的 OOP 面向对象编程似乎是自然的选择。然而，前端业务模型具有**高度异步、事件驱动、多输入多输出**的特性，使用传统 OOP 封装会产生大量复杂的异步调用链和回调嵌套。

这些调用链**异步执行且往往跨越多个业务域**，极大增加了代码的理解和维护成本。Vue 的响应式系统虽然简化了数据绑定，但在复杂业务场景下可能加剧问题：数据修改的触发点难以定位，副作用的传播路径不可预测，整体数据流变得难以追踪和调试。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

此时如果用流的形式来组织这些业务模型，就可以将这些调用链条变成一个流，流的形式可以很好地解决上述问题：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

流（Stream）是**异步编程的声明式高级抽象**，通过流式操作符的组合，可以优雅地处理复杂的异步编排，从根本上解决传统回调和 Promise 链式调用的复杂性问题。

在流式架构中，如果每个节点既能承载数据，又能承载逻辑，那么传统业务模型中的 Data 和 Methods 概念可以统一为流节点，实现数据和逻辑的一体化管理：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

基于流构建的前端业务模型完美契合了现代前端应用**高度异步、事件驱动、多输入多输出**的本质特征，在数据管理和业务逻辑组织方面都能提供更优雅、更可维护的解决方案。

## 流在框架中落地

[Rxjs](https://rxjs.dev/) 是流式编程的典型代表，它功能十分强大并提供了丰富的流式操作符，可以完成复杂的异步逻辑。但 Rxjs 概念较多、学习曲线陡峭，使用上也较为复杂，无法作为流的基础设施。

Promise 是前端最常接触的异步流式编程范式，使用非常简单，但作为流的形式它只能推送一次数据。Fluth 采用类 Promise 的流式编程范式，极大地降低了流式编程的门槛，让流编程范式可以作为前端业务模型的基础设施。

除了降低流编程的心智负担，Fluth 还为每个流节点保存了逻辑处理后的数据，让流节点既可以承载逻辑也可以承载数据，并成为业务模型的基本单元。

采用 Fluth 流来组织业务模型后，还有一个关键问题是如何实现流与前端框架的无缝集成。具体来说，需要解决双向转换问题：

- 对于 Vue 来说，响应式的数据可以通过 [to$](/cn/useFluth/to$.html) 方法转换为流

- 对于 Fluth 来说，流可以通过 [toComp](/cn/useFluth/toComp.html)、[toComps](/cn/useFluth/toComps.html) 等方法转换为 Vue 响应式数据，这样框架就可以直接消费流的数据

- 如果页面只需要渲染流的数据，可以通过 [render$](/cn/useFluth/render$.html) 指令绕过框架来响应式渲染流的数据，不会触发组件的更新

## 示例

下面以一个简单的例子——订单表单的提交页面，来展示流在业务模型中的应用：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

传统的前端开发采用命令式编程模式：

1. 点击按钮后，调用 handleSubmit 方法
2. handleSubmit 先 validateForm 方法，如果验证不通过，则提示报错
3. 验证通过拼装后台需要的数据
4. 调用后台 fetchAddOrderApi 方法
5. 如果调用成功，则继续调用 handleDataB 方法、handleDataC 方法
6. 如果调用失败，则提示报错

这种命令式开发模式混合了同步逻辑和异步操作，代码可读性较差，随着业务复杂度增长，handleSubmit 方法会变得越来越臃肿，形成典型的"上帝方法"反模式。

下面采用流的方式重新实现：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>

流式编程则能优雅地解决这些问题：将基础数据抽象为独立的流，通过组合操作符构建业务逻辑，代码结构清晰、逻辑原子化、复用性强。

流的任何一个节点都可以再次进行分流进行分支逻辑处理，不同分支的流也可以通过操作符进行合流处理，每一条逻辑都清晰可见并可组合将逻辑复用到极致。

对于模块 B 和模块 C 来说，它的数据和触发数据修改的行为 addOrder$ 都在同一个文件中，再也无需全局搜索哪里的调用改变了模块内部的数据。流让依赖反转，极大地提升了代码的阅读性。

值得注意的是，[audit](https://fluthjs.github.io/fluth-doc/cn/api/operator/audit.html)、[debounce](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html)、[filter](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html) 等操作符以声明式的方式处理了触发器、节流、条件过滤等复杂的异步控制逻辑，代码的表达力和可维护性都得到了显著提升。

通过这个对比案例可以看出，流式编程范式与前端业务的异步、事件驱动特性天然契合，是组织复杂前端业务逻辑的理想选择。
