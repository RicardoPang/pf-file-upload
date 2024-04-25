## 项目总结

1. 使用了什么技术

- 前端：Vue 3 + TypeScript + Vue Router + Pinia + Element Plus + Axios + Normalize.css
  - 使用Vue3 Composition API和Pinia来管理全局状态
  - 使用ts做类型声明，起到类型约束效果
  - 使用Vue Router 4 来管理路由
  - 使用Element Plus 来做UI组件库
  - 使用Vite来进行开发和构建
- 服务端：Node.js + Koa.js + TypeScript + Koa Router
  - 使用Koa.js结合TypeScript构建，利用Koa Router增强服务端开发，包括添加配置、全局异常拦截和日志功能。


2. 系统关键设计说明

- 前端

  - 前端大文件切分为多个分片，每个分片大小为10MB，核心利用Blob.prototype.slice方法
  - 封装axios网络请求，API相关操作抽为独立api文件维护，所有请求使用store管理
  - 使用worker计算文件hash
  - 前端并发上传，同时上传多个切片，记录切片顺序
  - 封装Scheduler实现并发控制，每次最多只能上传3个切片
  - 将待上传和已上传封装成组件
  - 体验优化（拖拽，进度条）
  - 异步任务并发数，切片报错处理

- 服务端

  - koa实现服务端，设置config，全局异常拦截，日志。addControllers自带哦国内读取controllers目录下所有文件，然后注册路由。通过middleware灵活设置content-type。

  - 通过单例模式封装全局store，实现file size的存取
  - 合并切片时机，/merge
  - 怎样合并切片，使用stream


3. 关键流程图：[流程图](https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=%E5%A4%A7%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E5%85%B3%E9%94%AE%E6%B5%81%E7%A8%8B%E5%9B%BE.drawio#R7Vtbd6M2EP41ekwOd8Qj%2BJK0m%2B5pT3Y37SMxCqbByAXsxPvrOwJhbsJ2NnGwSZ4sDUIGzXwz34wEUkeL56vYXc7%2FoB4JkSJ5z0gdI0WRJcWAHybZ5BJTU3OBHwceH1QKboOfpLiTS1eBR5LawJTSMA2WdeGMRhGZpTWZG8f0qT7sgYb1f126PmkJbmdu2JbeBV46z6VYMUv5NQn8efHPsmHlVxZuMZi%2FSTJ3PfpUEakTpI5iStO8tXgekZAtXrEud79t7sKbR%2BPq97%2BS%2F9zvzpdvX39c5JNNX3LL9hViEqVvO7WST712wxVfL%2F6u6aZYwJiuIo%2BwSSSkOvN0EUJThua%2FJE03XOHuKqUgonE6pz6N3PCG0iUf90CjlA%2BTWZ9Ens0UC%2F37kM4ec9E0CEP%2BH9Dj4zH0kjSmj1vdsQm2imCDQ%2FeehI47e%2FSzBx3RkMZwKaIRYVN5YAz8XcqHm5RS58C15TpI6CqekR3jODhSN%2FbJrvk4qtjzVeyUa%2B6K0AVJ4w0MiEnopsG6bswux4S%2FHVfqHRpc9S8wA7VtBhMdYQvhMZqYyHaQPUUT6EpMODEQBknWsKBtoomGHAc5BrvLsbIGSDDCdtYYIVvaYVdMp0%2FzICW3Szdb3CdwRXVbq9oQLJPjh26ScAvYYyAvU%2FCaxCl53qmS4qrB34k7RrnwE0%2Blm9nK5hUXo0mv16JPxtPV1%2FUXe%2FQ9ut7YjuXH8kV7jfebfx3dQvwKcF7RDKxqvPl7i1zo%2FMM6l4pe9MfP1avjTU0vDQC8IRKNA5GovhJ42a3g0NxNZcCSBlGaVGb%2BkwkqxqPVjUfRG857z3hZlRrmkj9BaTzbV%2Fl1eyogUfUKgHhThGamxxvmiuvW4YaBH0F7Bjol4Jcdhq8AorPNLywCz8sNkSTBT%2Fc%2Bm4%2BZB19BmFx3kD7eGkwLoFvqwG8uA3bVlLoB0wnwC%2BlSlnSrrqe89zLjKLVZDKEPDwkYZRPwb6Czdvx%2BVx9wqde8wJm4APm9gq9QZaLgCzAbsVA7CJgp%2B2Cm4BrICv2eBMp2GVZDZeAWbZnRJNtGeCRgR%2Bq0zYLmdHG%2FSvYzoBqnYXRo6i6CkK3YNQnXhGlbwJNahiEgS%2FCXQeRDzyh73zLkX2jH5E9mIwTKAv4kCfgTPhZ%2F0tta7cGZHtspykUWXvGKwuXQ%2BnSKbYQ90fgRTHiCkT3JcGayhmXO3WSeZSsSSzQG4TD1vbzEOHUPKXeQx1a6iHEmMbNs02z7x4FliarWd5ZoDc3LdTuvA5yc2aeT6wLJcKiftc%2BTqXqd%2Bp18giWbn%2FipLofRK4CwGEDDKVHIHQ6qwgXqAFJPHUCaWGVTZOsZuYOGknM6kGZ9YAkWpFZgaUYIa%2BV4wRqaPmuW7hIYhOWwmnM%2BujP%2FyqeAJ6%2FOcq5ZmcDSDvMAB2dlmoivvGtWVkSI0yhrv2NVu5uvHOCX1Y7a5nHL2g3jMaXdVe3GcOMdatqC6N3eqmIbXJh5EZaf2Mw39ZuWHAHmjbTEwH2nJYogLgyQV%2BFDedVrt6VepwxBKSzf%2FrXsLNLm0TqPvWMOE1aTgdhrIRsPg3spHRWwSuFaVdU6%2FTql0vUuA2xs9fNNe8yUyKhT2yWeWKXm7V2i2nCJOtYu9b6dokBbA3SKsuDUzAlWa8SnZFiygSsY%2BnBA6Z87yB%2BjpikL9rO7fXxv3EESwCRjCrZ9wLGws2QK8t46p3JmNKFA0Cek%2BHr0ekRE6TgjkpXHBoGg3Lx2IkgrUsRzOYsli46JACVQWYbEeYLwpGy7zAmPlpcz7exALlYY24CG42SSxp2f1c0u6nJy1c3i84qeqpvbzmlUN7dfiBy9PPJL5U1D21nfPE7FUhGVLD9eLaZjn7Gyk2xI9WOEJ78TVjxMTbPN4027uHMZQ4pck6WhNsJTfskyd32RAZeAPrBAkt1laYIJh5a86rgRAYy%2Bk1dVYAUDZNr8g4Xjf4%2FxOmWIktesnMMAmLtWnEkmyMnABVizDiRx7Q1pZSqqFx1G4s4ciM0dqCOei4Nu%2BZVm7rzLb13Vyf8%3D)

   ![大文件上传关键流程图](https://p.ipic.vip/hrmqug.jpg)

   - 选择文件上传服务器
   - 发送网络请求，封装axios，为什么封装，抽离api，为什么抽离
   - 文件切片，利用Blob.prototype.slice方法，将所有切片计算hash，worker实现，不阻塞主线程
   - 切片传服务器 /upload
   - 合并切片 /merge 等所有切片上传完毕后发送合并切片请求
   - 接收切片 ctx.request.files取到formData，ctx.request.body去到其他字段
   - 合并切片 /merge 排序切片，并发写入文件 stream实现，为什么使用并发速度快
   - 显示进度，progress
   - 断点，AbortController实现取消请求
   - 秒传，对比hash
   - 续传，判断服务端（/verify）是否已存在，存在秒传，不存在将剩余的切片上传

4. 过程中遇到什么问题

- 开发过程中会不自觉把大量的代码逻辑放在一起，而且习惯性忽略ts做类型声明或多使用any
  - 先完成功能，然后思考能否抽取组件、工具类方法抽取utils、状态逻辑不放在同一个地方该拆拆
  - 服务器接收参数和返回内容做ts类型约束，并在前端统一
- 使用类class封装axios，后面换网络库只需要改这个文件，但是没有抽离api，也是混在一个地方，不好维护
  - api抽离单独文件，使用store统一做数据处理
- 断点，取消切片上传原打算使用CancelToken实现，但是查看官网已废弃，所以后来采用AbortController 取消请求
- 文件上传速度慢，通过实现文件分片上传、worker计算hash和并发上传解决问题
- 并发过多http请求，为了防止过多的HTTP请求导致系统卡死，实现一个带有并发限制的异步调度器，确保同时运行的任务数最多为三个
- 关键节点、计算hash、发送请求有时没注意添加await，导致hash无值，服务器错误如缓存切片文件未创建等。前端逻辑要梳理清楚，同时服务器也要加日志和全局异常处理，操作文件尽量使用fs promises
- 跨域资源共享（CORS）问题，在vite配置文件设置server
- 服务器的开发缺乏设计、部分API不大熟悉、代码大部分写在app.ts中，而且有些没使用ts类型声明
  - app.ts只用于注册函数，支持设置config、全局异常处理、日志等
  - 使用koa-router集中处理不同URL
  - 所有URL处理函数开始放app.ts显得很混乱，抽离到controllers目录，然后提取一个middleware自动扫描该目录注册每个URL
  - 上面提取的middleware存在魔数、配置koaBody不够通用、不好维护、可读性差等问题，于是遵循建议使用明确的对象结构 const controller = {method:'get', path:'/api/upload', fn: ()=>{} }。配置koaBody支持传入middleware等
- 虽然启用ts，但是很多做类型声明，类型约束，使用any太多
- 操作文件使用同步方法，最好用fs promises处理
- ESM和CJS混用，只用ESM
- 函数名风格不统一，用驼峰命名法
- 全局变量保存属性，系统重启状态会丢失，做全局store，单例，封装读写行为
- 服务端合并切片，使用stream

## 一期项目问题

1. 架构分层模糊，模块之间耦合度极高；
2. 存在许多基础问题，如命名风格；
3. 全局状态使用的非常随便，缺乏设计
