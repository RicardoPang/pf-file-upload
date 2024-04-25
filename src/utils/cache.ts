enum CacheType {
  Local,
  Session
}

class Cache {
  storage: Storage

  constructor(type: CacheType) {
    this.storage = type === CacheType.Local ? localStorage : sessionStorage
  }

  setCache(key: string, value: any) {
    if (value) {
      this.storage.setItem(key, JSON.stringify(value))
    }
  }

  getCache(key: string) {
    const serializedValue = this.storage.getItem(key)
    if (serializedValue) {
      // 将字符串转换回对象
      const value = JSON.parse(serializedValue)
      if (value.blob) {
        // 如果对象包含 Blob 数据，则需要使用 Blob 构造函数将其还原
        const blob = new Blob([value.blob], { type: value.blob.type })
        value.blob = blob
      }
      return value
    }
    return null
  }

  removeCache(key: string) {
    this.storage.removeItem(key)
  }

  clear() {
    this.storage.clear()
  }
}

const localCache = new Cache(CacheType.Local)
const sessionCache = new Cache(CacheType.Session)

export { localCache, sessionCache }

// 暂时不用
