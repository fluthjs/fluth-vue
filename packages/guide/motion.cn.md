# 动机

## 前端业务模型

在 Web 开发领域中，Web 服务的核心职责通常是接收请求、处理请求并返回响应，从系统建模的角度看，它是一个单输入单输出的处理过程。
这使得 Web 服务的逻辑天然适合抽象为洋葱模型（onion model）：外层中间件包裹内层中间件，请求按顺序穿透各层中间件进入核心业务处理逻辑，再逐层返回响应。常见的中间件包括身份验证、权限校验、日志记录、缓存处理等。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

而 Web 前端的业务模型与此完全不同。前端页面运行在用户浏览器中，是一个多输入多输出的复杂系统。它面向用户直接交互，输入来源包括用户点击、输入、滚动、窗口变化、定时器触发、网络 API 响应等，这些事件发生的时间不确定、频率不一致，构成了一个**高度异步、事件驱动**的环境。

与此同时，前端系统也会产生多样化的输出，这些输出不再局限于一次性返回的响应，而是持续、分散地反馈到多个目标上。常见的输出包括更新页面中的 DOM 结构以反映状态变化，执行动画或过渡效果增强用户体验，发送新的 API 请求以拉取或提交数据，修改本地状态（如缓存、存储或组件状态）以准备后续交互甚至与浏览器原生功能交互（如剪贴板、通知、文件系统等），这些输出通常也是**动态分发、异步反馈**的方式。

复杂的输入和输出方式，与传统 Web 服务的“请求-响应”式单一输出形成鲜明对比。

## 前端框架的演化

为了应对前端页面中**高度异步、事件驱动、多输入多输出**的复杂环境，前端开发逐步演化出依托各种框架的编程范式，其中最具代表性的就是 `MVVM（Model-View-ViewModel）`框架。

这一范式的核心思想是：将页面的显示逻辑与状态逻辑解耦，并通过**响应式绑定**让它们自动协同。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

在 MVVM 模型中：

- View（视图） 代表用户界面（UI），它是用户交互的前端展现层。
- Model（模型） 承载了数据与业务状态，是系统运行的核心信息源。
- ViewModel 是连接 View 和 Model 的桥梁，它负责将 Model 中的数据“转换”为视图需要的格式，同时监听用户操作并更新 Model。

MVVM 框架的最大优势在于：
当 Model 发生变化时，View 会自动更新；反之，用户操作 View 时，也能自动反映到 Model 上。

这一“自动同步”机制，本质上是一种声明式响应式编程。开发者不再需要显式地组织输入事件、手动更新视图，而是专注于描述“状态如何映射为界面”，让框架负责具体的事件监听和 DOM 更新。

借助这一模型，前端框架能够高效地组织来自用户、网络、定时器等多源输入，并以结构化的方式触发 UI 渲染、状态更新、逻辑调用等多通道输出，使得原本混乱的异步交互逻辑被框架层稳定接管。

## 复杂业务架构分层

虽然前端框架在处理数据变化更新页面这件事情上做的非常出色，但是随着业务的复杂度不断提升，框架提供出来的编程范式反而会将成为业务的瓶颈。前端框架的编程范式大多都是以组件为核心，以 hooks为颗粒度，将业务逻辑组织在组件中。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/page.drawio.svg" alt="motion" />
</div>

将数据的请求、逻辑的处理统一放置在组件中进行处理，数据和逻辑链条通过组件树层层递进，功能也是通过组件来进行组织。对于简单业务这样做似乎没有问题，但是对于复杂业务，下面这些问题就会暴露出来：

1. **组件过于臃肿**：数据的请求、数据的转换、数据的逻辑处理、全部堆在组件内部
2. **代码阅读困难**：业务逻辑散落在各个组件中，需按照组件链条来理解业务
3. **通信复杂**：组件层层嵌套，通信非常复杂，也难以理解
4. **定位困难**：定位问题需要按照组件链条来排查，成本非常高
5. **无法复用**：视图的差异性导致数据处理和业务逻辑无法复用
6. **重复请求**：组件内部请求数据导致可以复用的数据难以复用
7. **复杂度高**：数据流呈现螺旋网状调用，牵一发而动全身

如果认为前端状态是一系列数据和逻辑的总和，那么 Url 变化、DOM 元素的操作、定时器、http 请求等副作用导致状态在一直动态变化，**界面其实是状态某一个时刻的切片**。

将状态直接放入界面中其实是本末倒置，将状态从视图层抽离构造出业务模型，视图消费状态才符合上述理念：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/ddd.drawio.svg" alt="motion" />
</div>

当将业务模型从组件抽离后，组件变成了**受控**，只消费模型提供的数据。那么我们该如何组织业务模型呢？我们的代码已经不在组件内，`vue`或者`react`提供的编程范式也不再适用。

## 模型驱动与流

在构造业务模型的时候，通常会将功能高度内聚的 logic 抽离出来组成 Model，Model 是业务模型的核心，它承载了业务的核心数据和逻辑:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

从本质上来说，模型是高内聚的数据和逻辑的集合，似乎直接用`OOP`面相对象进行封装就可以达到目的，但是前面提到前端业务模型是**高度异步、事件驱动、多输入多输出**的，使用`OOP`进行封装，那么就会出现大量的异步调用链。

这些调用链条由于是**异步且往往横跨多个业务模型**，导致代码难以阅读和维护，而`vue`的数据响应式往往会加剧这一问题，数据不知道在哪个环节被修改，修改后又可能不知情的触发其他逻辑，导致数据流变得难以追踪:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

此时如果用流的形式来组织这些业务模型，那么就可以将这些调用链条变成一个流，流的形式可以很好的解决上述问题:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

流是一种对**异步编程声明式的高级抽象**，通过流以及操作符，可以完成非常复杂的异步编排从而摆脱传统的复杂的调用逻辑关系。

当流的每个节点既可以存储数据，也可以处理数据，那么业务模型的 Data 和 Methods 也可以丢弃，全部以流的节点的形式来进行：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

这种以流为基础构成的前端业务模型，完美的契合了前端业务模型**高度异步、事件驱动、多输入多输出**的特点，它既可以很好的组织业务数据，也可以很好的组织业务业务逻辑。

## 流在框架中落地

用流来组织业务模型，流的输入和输出都需要和前端框架进行交互，那么流如何转换为前端框架的可以消费的数据和逻辑呢？

- 对于`vue`来说，响应式的数据可以通过 [to$](/cn/useFluth/to$.html) 方法转换为流

- 对于`fluth`来说，流可以转换为`vue`的响应式数据，通过 [toComp](/cn/useFluth/toComp.html)、[toComps](/cn/useFluth/toComps.html) 等方法转换为响应式数据，这样框架就可以直接消费流的数据

- 如果页面只需要渲染静态的渲染流的数据，可以通过 [render$](/cn/useFluth/render$.html) 指令绕过框架来响应式渲染流的数据，不会触发组件的更新

## 示例

下面以一个简单的例子:订单表单的提交页面，来展示流在业务模型中的应用：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

传统的开发方式一般采用的命令式的开发方式：

1. 点击按钮后，调用 handleSubmit 方法
2. handleSubmit 先 validateForm 方法，如果验证不通过，则提示报错
3. 验证通过拼装后台需要的数据
4. 调用后台 fetchAddOrderApi 方法
5. 如果调用成功，则继续调用 handleDataB 方法、handleDataC 方法
6. 如果调用失败，则提示报错

这种命令式的开发方夹杂着异步的操作，整体阅读体验非常差，随着业务逻辑的增加，handleSubmit 方法会变得越来越臃肿，难以维护。

下面采用流的方式重新实现：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>

而采用流的方式可以很好的解决这个问题，将基础数据拆分成一个个的流，通过流的组合操作符来完成业务，不管是代码阅读、维护都非常清晰，功能也趋于原子化，可以很好的复用。

注意其中的 [audit](https://fluthjs.github.io/fluth-doc/cn/api/operator/audit.html)、[debounce](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html)、[filter](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html)操作符，通过简单的操作符就完成了复杂的业务逻辑，让整体的代码阅读和维护都非常清晰。

从这个例子中可以看出，采用流来组织业务代码，非常适合前端的业务模型。
