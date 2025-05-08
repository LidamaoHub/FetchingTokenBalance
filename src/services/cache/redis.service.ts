import { createClient } from 'redis';


type RedisClient = ReturnType<typeof createClient>;

class RedisService {
  private static client: RedisClient | null = null;
  private static isConnecting: boolean = false;
  private static connectionPromise: Promise<RedisClient> | null = null;

  // 获取 Redis 客户端实例
   
  static async getClient(): Promise<RedisClient> {
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      const client = createClient({
        url: redisUrl
      });

      client.on('error', (err) => {
        console.error('Redis 连接错误:', err);
        reject(err);
      });

      client.on('ready', () => {
        console.log('Redis 连接成功');
      });

      client.connect()
        .then(() => {
          this.client = client;
          this.isConnecting = false;
          resolve(client);
        })
        .catch((err) => {
          console.error('Redis 连接失败:', err);
          this.isConnecting = false;
          reject(err);
        });
    });

    return this.connectionPromise;
  }

  // 设置缓存
  static async set(key: string, value: any, ttlSeconds: number = 30): Promise<void> {
    try {
      const client = await this.getClient();
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      console.log(`[Redis] 缓存数据: ${key}, 有效期: ${ttlSeconds}秒`);
    } catch (error) {
      console.error('Redis 设置缓存失败:', error);
      throw error;
    }
  }

  //读取缓存
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client.get(key);
      
      if (!value) {
        return null;
      }
      
      console.log(`[Redis] 命中缓存: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis 获取缓存失败:', error);
      return null;
    }
  }

  // 删除缓存

  static async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
      console.log(`[Redis] 删除缓存: ${key}`);
    } catch (error) {
      console.error('Redis 删除缓存失败:', error);
      throw error;
    }
  }

  // 关闭 Redis 连接

  static async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      console.log('Redis 连接已关闭');
    }
  }
}

export default RedisService;
