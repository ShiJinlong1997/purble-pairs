# 《记忆卡片》文档

## 操作

选择卡使正面向上，若选到两张卡图案相同会消除，否则卡会背面向上。如果选了一张普通卡和一张幸运卡，会自动帮助找到张同图案卡后消除。

## 页面结构

```html
<!-- 卡片皆 div#blackboard 子元素 -->
<div id="blackboard"></div>
```

```html
<div class="card apple showfront"></div>
<!--
div.card 记录卡类型和显示状态
类名 "card" 是卡片基本样式
类名 "apple" | "pear" | "lemon" | "watermelon" 是卡类型，决定正面图案
类名 "showfront" 有则显示正面，用于选择卡动画
类名 "hide" 有则隐藏卡，用于配对成功后动画
 -->
<!-- 用于生成卡片 -->
<template id="cardTpl">
  <div class="card">
    <div class="card-back"></div>
    <div class="card-front"></div>
  </div>
</template>
```

## 样式

- 黑板

  ```css
  #blackboard {
    box-sizing: border-box;
    position: relative;
    width: 90%;
    max-width: 400px;
    height: auto;
    margin: 5% auto 0;
    border: 12px solid #e4c27a;
    box-shadow: 0 0 0 2px #fee2b5,
                0 0 0 4px #c39f6f;
    background: #8daf9f;
    outline: 2px solid #c09e75;
    outline-offset: -10px;
  }
  
  /* 用于宽高等比缩放 */
  #blackboard::before {
    content: '';
    display: block;
    width: 100%;
    padding-top: 100%;
  }
  ```

  ```css
  .card {
    /* 程序生成 div.card 用行和列下标决定属性 top，left 值 */
    position: absolute;
    ...
  }
  ```

  ```css
  .card-front,
  .card-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* "/"之前是 background-position，之后是 background-size */
    background: #eee center center / auto 80% no-repeat;
    box-shadow: 0 1px 2px #9785cf;
    backface-visibility: hidden;
    transition: transform .5s linear;
  }
  
  /* 背面不动，默认背面向上，正面先转过去180° */
  .card-front { transform: rotateY(180deg); }
  .card-back { background-image: url(../img/back.png); }
  ```

## 程序

### 概述

```typescript
// 用于生成卡片时确定各类卡数量
type CardCountDic = {[prop: string]: number};
const cardTypeCountDic: CardCountDic = {
  apple: 0,
  pear: 0,
  lemon: 0,
  watermelon: 0,
  lucky: 0,
};

// 用于随机生成卡类型
const cardTypes: string[] = Object.keys(cardTypeCountDic);

// 4类普通卡各6张，加1张幸运卡 4*6+1 共 25 张卡
const maxCountSameTypeCard: number = 6;

// 记录正面向上的卡，数量达2张后判断是否同图案
const selectedCards: HTMLDivElement[] = [];

// 卡动画播放时不可点击
let selectAble: boolean = true;
```

初次游戏遍历行列生成卡片，每张卡随机类型

黑板 `div#blackboard` 添加事件监听器，事件类型为  `'click' | 'touchend'` ，选择卡则触发 `handleSelect()` 。

触发事件元素，即被点 HTML 元素可能是 黑板 `div#blackboard` 或 卡片 `div.card` ，选择卡片才能继续。

选择卡会转卡，如果翻转后正面向上则记录此卡已选，否则删除此卡已选记录

选择够2张卡后判断是否同类型卡，若相同则消除；否则判断是否为一张普通卡和一张幸运卡，是则自动翻开张同类型卡后消除这三张卡，否则这些正面向上的卡反面向上。

### 解惑

- `async` 和 `await`

  `async function funcName() { ... }` 为异步函数，遇到 `await` 就先执行 `await` 之后的，等异步操作完成再继续 `async` 函数后面的语句。

  ```typescript
  async function init(): Promise<void> {
    // 两层 for () 创建并添加 div，等 div 动画结束才能选择卡
  
    // 1.上面的代码添加 HTML 元素（动画将开始）
    selectAble = false; // 2.赋值 selectAble = false; 不可选择卡
    await waitCardRotate(); // 3.开始等待，直到.5s后才继续后面的代码
    selectAble = true; // 4.结束等待，动画也结束了，现在开始可选择卡
  }
  ```

- 用 template 创建元素

  如果只用代码创建卡片，需要调 `document.createElement()` 和 `document.createElement()` 多次，代码量大。

  像本程序创建卡片，获取 template 的内容后仅需设置类名和样式，创建重复元素更方便。

- `init()` 里为何不直接 `blackboard.appendChild(card)` ？而在 for () 中文档片段添加卡片后再在 blackboard 添加文档片段？

  > `DocumentFragment` 不是真实 DOM 树的一部分，它的变化不会触发 DOM 树重新渲染，不会导致性能等问题

  本程序要添加25张卡，都添加到文档片段里，文档片段再添加到 blackboard 只会重新渲染一次 DOM 树

- [...cards]

  cards 是 HTMLCollection，一个 HTML 元素集合，这个类数组对象（类似数组有length但不是数组）没有 `push()` , `filter()` 等方法，需要转成数组。 `... ` 运算符装饰 cards 各项 HTML元素取出，再装入数组。可以想成 `[].push(many HTMLElement)` 。

## 引用

关于 &lt;template&gt; [MDN介绍](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/template)

> HTML内容模板（&lt;template&gt;）元素是一种用于保存客户端内容机制，该内容在加载页面时不会呈现，但随后可以(原文为 may be)在运行时使用JavaScript实例化。
>
> 将模板视为一个可存储在文档中以便后续使用的内容片段。虽然解析器在加载页面时确实会处理&lt;template&gt;元素的内容，但这样做只是为了确保这些内容有效；但元素内容不会被渲染。

关于 `backface-visibility` [MDN介绍](https://developer.mozilla.org/zh-CN/docs/Web/CSS/backface-visibility)

> CSS 属性 backface-visibility 指定当元素背面朝向观察者时是否可见。

关于 `DocumentFragment` [MDN介绍](https://developer.mozilla.org/zh-CN/docs/Web/API/DocumentFragment)

