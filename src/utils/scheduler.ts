export class Scheduler {
  private queue: (() => Promise<void>)[] = []
  private maxCount: number
  private runCounts = 0

  constructor(limit: number) {
    this.maxCount = limit
  }

  add(promiseCreator: () => Promise<void>) {
    this.queue.push(promiseCreator)
    this.run()
  }

  private run() {
    if (this.runCounts >= this.maxCount || this.queue.length === 0) {
      return
    }
    this.runCounts++
    const task = this.queue.shift()!
    task().finally(() => {
      this.runCounts--
      this.run()
    })
  }
}
