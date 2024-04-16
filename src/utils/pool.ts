export class ConcurrencyPool {
  private concurrency: number
  private ongoing: Promise<any>[]
  private queue: (() => Promise<any>)[]

  constructor(concurrency: number) {
    this.concurrency = concurrency
    this.ongoing = []
    this.queue = []
  }

  enqueue(task: () => Promise<any>) {
    this.queue.push(task)
    this.runNext()
  }

  runNext() {
    // 当前正在执行的任务数量小于最大并发数，且队列中还有任务等待执行时，继续执行任务
    while (this.ongoing.length < this.concurrency && this.queue.length > 0) {
      // 从队列中取出一个任务
      const task = this.queue.shift()!
      // 执行任务，并将任务的 Promise 添加到正在执行的任务列表中
      const promise = task().then(() => {
        // 当前任务执行完毕后，从正在执行的任务列表中移除该任务
        this.ongoing = this.ongoing.filter((p) => p !== promise)
        // 继续执行下一个任务
        this.runNext()
      })
      this.ongoing.push(promise)
    }
  }
}
