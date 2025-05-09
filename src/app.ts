import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// 导入路由
import apiRoutes from './routes/api.routes';

// 加载环境变量
dotenv.config();

// 初始化 Express 应用
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);


app.set('trust proxy', true); 


// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json()); // 解析 JSON 请求体
app.use(morgan('dev')); // 日志记录

// 限流中间件 - 每个 IP 每分钟最多 60 个请求
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 60, // 每个 IP 最多 60 个请求
  standardHeaders: true,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use(limiter);

// 路由
app.use('/api', apiRoutes);

// 根路由
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OneKey 钱包 API 服务正在运行',
    endpoints: {
      getTokens: '/api/token?address=0x...&network=eth&page=1&pageSize=30',
      getNfts: '/api/nft/:network/:address'
    }
  });
});

// 404 处理
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, '127.0.0.1', () => {
  console.log(`服务器运行在 http://127.0.0.1:${PORT}`);
});

export default app;
