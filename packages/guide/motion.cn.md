# 动机

## 前端业务模型

在 Web 开发领域中，后端服务的核心职责是接收、处理、响应请求。从系统建模的角度来看，这是一个典型的单输入单输出处理流程。

这种特性使得后端服务的逻辑天然适合抽象为洋葱模型（Onion Model）：外层中间件包裹内层中间件，请求按顺序穿透各层中间件进入核心业务处理逻辑，再逐层返回响应，这种编程范式是最符合后端服务的业务模型。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/model.drawio.svg" alt="motion" />
</div>

而 Web 前端的业务模型与此截然不同。前端应用运行在用户浏览器中，本质上是一个多输入多输出的复杂响应式系统。它直接面向用户交互，输入来源极其多样化：用户操作（点击、输入、滚动）、系统事件（窗口变化、定时器触发）、网络响应（API 调用、WebSocket 消息）等。这些事件在时间维度上不可预测，频率完全异构，构成了一个**高度异步、事件驱动**的执行环境。

与此同时，前端系统的输出同样复杂多样，不再局限于一次性的响应返回，而是持续、分散地作用于多个目标。典型的输出包括：DOM 更新（反映状态变化）、视觉反馈（动画、过渡效果）、网络通信（API 请求、数据提交）、状态同步（缓存更新、本地存储）等。

前端复杂的输入和输出方式，与后端服务单输入单输出形成鲜明对比，前端的编程范式应该是什么样的呢？

## 前端框架的演化

为了应对前端应用中**高度异步、事件驱动、多输入多输出**的复杂环境，前端开发社区逐步演化出基于框架的编程范式，其中最具代表性的是 MVVM（Model-View-ViewModel）架构模式。

这一范式的核心思想是：将页面的显示逻辑与状态逻辑解耦，并通过**响应式绑定**让它们自动协同。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/mvvm.drawio.svg" alt="motion" />
</div>

MVVM 框架的最大优势在于：当 Model 发生变化时，View 会自动更新；反之，用户操作 View 时，也能自动反映到 Model 上。

这一“自动同步”机制，本质上是一种声明式响应式编程。开发者不再需要显式地组织输入事件、手动更新视图，而是专注于描述“状态如何映射为界面”，让框架负责具体的事件监听和 DOM 更新。

但是这种响应式只做了一半，也就是 VM 和 V 之间的响应，**并没有解决业务模型的问题也就是 Model 怎么组织的问题**，而是统一交由组件来封装处理。

## 复杂业务架构分层

随着业务复杂度的指数级增长，框架组件化编程范式逐渐暴露出架构层面的局限性。

主流前端框架普遍采用以组件为核心、以 Hooks/Composition API 为逻辑颗粒度的开发模式，将业务逻辑内聚在组件内部。**Hooks/Composition 里面组织代码的形式都是采用类 OOP 的编程范式**：抽象成数据+修改数据的方法，但是与 OOP 不同的地方在于：组合优于继承；

框架也支持对逻辑响应式编程，比如 watch、useEffect 等方式，但是对于阅读代码而言体验非常糟糕，所以大部分开发者还是采用命令式编程：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/page.drawio.svg" alt="motion" />
</div>

在这种模式下，数据获取和业务逻辑处理都集中在组件内部，业务功能通过组件树的层级关系进行组织，数据和逻辑链路沿着组件层次结构传递，异步方法的回调沿着组件遍布。这种架构对于中小型应用运行还算良好，但在企业级复杂业务场景下，会产生以下架构性问题：

1. **组件过于臃肿**：数据的请求、数据的转换、数据的逻辑处理、全部堆在组件内部
2. **代码阅读困难**：业务逻辑散落在各个组件中，需按照组件链条来理解业务
3. **通信复杂**：组件层层嵌套，通信非常复杂，也难以理解
4. **定位困难**：定位问题需要按照组件链条来排查，成本非常高
5. **无法复用**：视图的差异性导致数据处理和业务逻辑无法复用
6. **重复请求**：组件内部请求数据导致可以复用的数据难以复用
7. **复杂度高**：数据流呈现螺旋网状调用，牵一发而动全身

从架构设计角度来看，前端应用的状态是数据和逻辑的动态组合体，URL 路由、用户交互、定时任务、HTTP 请求等副作用操作持续驱动状态变迁，而**UI 界面本质上是应用状态在特定时刻的快照**。

将状态逻辑直接耦合在视图层是一种架构上的倒置，正确的做法应该是将状态管理从视图层解耦，构建独立的业务模型层，让视图成为状态的消费者：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/ddd.drawio.svg" alt="motion" />
</div>

业务模型从组件中抽离后，组件转变为**受控组件**，专注于数据展示和用户交互，业务逻辑由独立的模型层负责。此时面临的核心问题是：**在脱离了 Vue/React 组件体系后，如何有效地组织和管理这些业务模型？**

## 模型驱动与流

在构造业务模型的时候，通常会将功能高度内聚的 logic 抽离出来组成 module 是业务模型的核心，它承载了业务的核心数据和逻辑:

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic.drawio.svg" alt="motion" />
</div>

从理论上讲，业务模型是高内聚的数据和逻辑的封装体，采用传统的 OOP 面向对象编程范式似乎是自然的选择。然而前端业务模型具有**高度异步、事件驱动、多输入多输出**的特性，**在这种场景下使用传统 OOP 封装会产生大量复杂的异步调用链和回调嵌套**。

这些调用链**异步执行且往往跨越多个业务域**，极大增加了代码的理解和维护成本。Vue 的响应式系统但在复杂业务场景下可能加剧问题：数据修改的触发点难以定位，副作用的传播路径不可预测，整体数据流变得难以追踪和调试。

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-complex.drawio.svg" alt="motion" />
</div>

此时如果用管道的形式来组织这些业务模型，将核心异步链路通过管道串联起来，可以很好地解决上述问题：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-flow.drawio.svg" alt="motion" />
</div>

这种管道非常适合用流来进行搭建，流是**声明式异步编程的高级抽象**，通过流式操作符的组合，可以优雅地处理复杂的异步编排，从根本上解决传统回调和异步链式调用的复杂性问题。

如果流除了常规的管道能力，还可以运转逻辑承载数据，那么**传统业务模型中的 Data 和 Methods 概念可以统一为流节点**，实现数据和逻辑的一体化管理：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/logic-stream.drawio.svg" alt="motion" />
</div>

基于流构建的前端业务模型完美契合了现代前端应用**高度异步、事件驱动、多输入多输出**的本质特征，在数据管理和业务逻辑组织方面都能提供更优雅、更可维护的解决方案。

## 流在框架中落地

[Rxjs](https://rxjs.dev/) 是流式编程的典型代表，它功能十分强大并提供了丰富的流式操作符，可以完成复杂的异步逻辑。但 Rxjs 概念较多、学习曲线陡峭，使用上也较为复杂，无法作为承载业务的基础设施。

Fluth 采用类 Promise 的流式编程范式，Promise 是前端最常接触的异步流式编程范式，**类 Promise 的流式编程范式极大地降低了流式编程的门槛**，让流可以作为前端开发中的最基础逻辑单元。

除了降低流编程的心智负担，Fluth 还为每个流节点保存了逻辑处理后的数据，让流节点既可以承载逻辑也可以承载数据，**可以成为替代 ref、reactive 响应式数据的基础单元**。

为了大规模使用并且在框架中落地，Fluth 流还提供了以下能力：

### 框架集成

- 对于 Vue 框架来说，ref、reactive、computed 响应式的数据可以通过 [to$](/cn/useFluth/to$.html) 方法转换为 fluth 流，为了保持 fluth 流的 immutable 的特性会将数据 deepClone 后再给到 fluth

- 对于 Fluth 流来说，流的 [ref](/cn/useFluth/#ref) 属性就是响应式数据，也可以采用 [toCompt](/cn/useFluth/#tocompt) 方法转换为 computed 响应式数据，这样框架就可以直接消费流的数据，并可以通过 vue-devtools 直接查看流的数据

### 调试能力

fluth 流底层采用 immutable 数据结构，并提供了丰富的调试插件：

- 通过 [consoleNode](https://fluthjs.github.io/fluth-doc/cn/api/plugin/consoleNode.html)插件可以方便的打印流节点数据

- 通过 [consoleAll](https://fluthjs.github.io/fluth-doc/cn/api/plugin/consoleAll.html)插件可以方便的查看流所有的节点数据

- 通过 [debugNode](https://fluthjs.github.io/fluth-doc/cn/api/plugin/debugNode.html)插件可以方便的调试流节点数据，并可以查看流节点的调用栈

- 通过 [debugAll](https://fluthjs.github.io/fluth-doc/cn/api/plugin/debugAll.html)插件可以方便的调试流所有的节点数据，并可以查看流节点的调用栈

两项能力让 fluth 流**可以像 ref、reactive 响应式数据一样在 vue 框架中获得广泛使用**。

## 示例

下面以一个简单的例子——订单表单的提交页面，来展示流在业务模型中的应用：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/traditional-code.drawio.svg" alt="motion" />
</div>

传统的前端开发采用**命令式编程模式**：

- 点击按钮后，调用 handleSubmit 方法
- handleSubmit 先 validateForm 方法，如果验证不通过，则提示报错
- 验证通过拼装后台需要的数据
- 调用后台 fetchAddOrderApi 方法
  - 如果调用成功，则继续调用 handleDataB 方法、handleDataC 方法
- 如果调用失败，则提示报错

这应该是大部分前端开发者的日常，开发日常不代表天经地义，这种命令式开发模式、夹杂同步逻辑异步操作，**随着业务复杂度增长，handleSubmit 方法会变得越来越臃肿，也将变得越来越难以复用**。

下面采用流的**声明式编程方式**重新实现：

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <img src="/stream-code.drawio.svg" alt="motion" />
</div>

按照业务逻辑，代码实现为六条流：form$、trigger$、submit$、validate$、payload$、addOrderApi$，**每一条流都承载着独立的逻辑，流的先后顺序按照业务真实顺序进行组织**。form$、trigger$ 负责将用户的输入转换为流，validate$、addOrderApi$ 则将流的处理结果传递用户。

通过代码可以发现：

- **复用性提升**，采用流式编程范式后**逻辑充分的原子化了**，而流既可以**分流又可以合流**可以轻易的对这些逻辑原子进行逻辑组合，代码的复用性空前的提高
- **维护性提升** ，代码从上到下是按照业务真实顺序进行组织的，当前只有一个 handleSubmit 方法可能还不明显，当业务逻辑复杂后，按照业务事实顺序组织代码将对阅读性、维护性有极大的提升
- **表达力提升**，[audit](https://fluthjs.github.io/fluth-doc/cn/api/operator/audit.html)、[debounce](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html)、[filter](https://fluthjs.github.io/fluth-doc/cn/api/operator/debounce.html) 等操作符以声明式的方式处理了触发器、节流、条件过滤等复杂的异步控制逻辑，通过流的操作符，代码的表达力显著提升。
- **控制反转**，相对于方法调用这种”拉“的方式，流式编程范式是”推“的方式，可以实现数据、修改数据的方法、触发数据修改的行为都放置在同一个文件夹内，再也无需全局搜索哪里的调用改变了模块内部的数据。

### 复用性和可维护性说明

对于命令式的编程，在 handleSubmit 后续的迭代中可能需要分场景：

- 场景 A 调用 fetchAddOrderApi 成功后只需要调用 handleDataB 方法
- 场景 B 调用 fetchAddOrderApi 成功后只需要调用 handleDataC 方法

此时 handleSubmit 只能将场景变为参数交由 if - else 来处理，随着越来越多的分支逻辑，函数逐渐膨胀。如果用流式编程范式来实现，这个问题可以轻松解决：

- 如果场景是流的话，通过组合流就可以轻松解决

  ```typescript
  // 场景 A 流
  const caseA$ = $();
  addOrderApi$.pipe(audit(caseA$)).then(handleDataB);
  caseA$.next();

  // 场景 B 流
  const caseB$ = $();
  addOrderApi$.pipe(audit(caseB$)).then(handleDataC);
  caseB$.next();
  ```

- 如果场景是数据的话，既可以通过分流也可以通过过滤来处理，两种方式都可以轻松解决

  ```typescript
  // 场景流，可能是 A，也可能是 B
  const case$ = $<"A" | "B">();

  // 方法1: 分流
  const [caseA$, caseB$] = partition(case$, (value) => value === "A");
  addOrderApi$.pipe(audit(caseA$)).then(handleDataB);
  addOrderApi$.pipe(audit(caseA$)).then(handleDataC);

  // 方法2: 过滤
  const caseAA$ = addOrderApi$
    .pipe(filter(case$.value === "A"))
    .then(handleDataB);

  const caseBB$ = addOrderApi$
    .pipe(filter(case$.value === "B"))
    .then(handleDataC);
  ```

## 延伸

上面是一个简单的示例，如果业务逻辑复杂传统开发模式下，一个 setup 函数下面可能有几十个 ref 和几十个 methods，如果认为 setup 是一个 class，那么这个 class 将拥有几十属性和方法以及的丑陋的 watch，阅读和维护成本将非常的高。

虽然更小粒度的的抽离组件以及 hooks 的开发理念可以解决部分问题，但现实是当前大量现存业务就是由无数个这样的臃肿的 setup 函数构造的组件组装的（心疼前端开发一秒），因为种种原因（懒或者没有心智）一旦 setup 成为这个臃肿的 class，那么后续的开发者只能在这个 setup 上持续“深耕”。

而流式编程范式可以很好的解决这个问题，随着业务持续迭代，代码也会也来也长；但是**流式编程是按照业务真实顺序进行声明式组织代码**，相当于一条线不断延伸，此时要抽离逻辑只需要将线剪成几段分别放入 hook 就好了，完全没有心智负担，相当于有一个很重的业务，只需要几分钟就可以解决重构好。

通过这个示例和延伸可以看出，**流式编程范式与前端业务的异步、事件驱动特性天然契合，是组织前端业务逻辑的理想选择**。
