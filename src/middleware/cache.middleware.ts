import { Request, Response, NextFunction } from 'express';
import { ApiResponse, MiddlewareFunction } from '../types';
import RedisService from '../services/cache/redis.service';

/**
 * Redis 缓存中间件
 * 为请求添加基于 Redis 的缓存功能，减少重复请求对外部 API 的调用
 * 短时间内的重复请求将返回缓存的结果，减少资源消耗
 * 使用 Redis 存储缓存，支持多实例共享缓存
 * @param {number} durationSeconds - 缓存持续时间（秒），默认 30 秒 .env中设置
 * @returns {MiddlewareFunction} Express 中间件
 */
const cacheMiddleware = (durationSeconds: number = Number(process.env.REDIS_CACHE_DURATION_SECONDS) || 30): MiddlewareFunction => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 根据请求路径和查询参数生成缓存键
    const key = `api:${req.originalUrl || req.url}`;
    
    try {
      const cachedBody = await RedisService.get<ApiResponse>(key);
      
      if (cachedBody) {
        // 如果缓存存在，直接返回缓存的数据
        res.json(cachedBody);
        return;
      }
      
      // 如果缓存不存在，修改 res.json 方法以便在发送响应前缓存数据
      const originalJson = res.json;
      res.json = function(body: ApiResponse): Response {
        // 只缓存成功的响应
        if (body && body.success === true) {
          // 异步存储到 Redis，不阻塞响应
          RedisService.set(key, body, durationSeconds).catch(err => {
            console.error('存储缓存到 Redis 失败:', err);
          });
        }
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      // 如果 Redis 操作出错，记录错误并继续处理请求，不影响用户体验
      console.error('Redis 缓存中间件错误:', error);
      next();
    }
  };
};

export default cacheMiddleware;
