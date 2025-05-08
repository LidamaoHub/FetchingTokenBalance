# 钱包资产 API

这是一个基于 Express 的 API 服务,用于获取钱包地址的 ERC20/NFT 代币余额信息

目前实现了'eth','polygon','arbitrum','optimism','base','bsc'等链的erc20代币获取

主要采用了朴素SDK获取和基于热门代币的快速分析multicall方案的BSC token列表获取

## 安装与运行

### 前置条件

- Node.js (v14+)
- npm 或 yarn
- Alchemy API 密钥

### 安装步骤

1. 克隆仓库
```
git clone <仓库地址>
cd onekey-wallet-api
```

2. 安装依赖
```
npm install
```

3. 配置环境变量
创建 `.env` 文件并添加以下内容：
```
PORT=3000
ALCHEMY_API_KEY=your_alchemy_api_key
```
修改名称为.env



4. 启动服务
```
npm run dev
```

## API 使用

### 获取钱包 ERC20 代币余额

```
GET /api/token?address={your_wallet_address}&network={network}
```

参数：
- `network`: 网络缩写（如 eth, polygon 等）
- `address`: 钱包地址

示例请求：
```
GET /api/token?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e&network=eth
```

示例响应：
```json
{
    "success": true,
    "data": {
        "address": "0xb0ee1755460dddb01f73104df2e61a89b0464885",
        "network": "bsc",
        "tokens": [
            {
                "contractAddress": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                "symbol": "USDC",
                "name": "USDC",
                "decimals": 18,
                "logo": null,
                "balance": "2703"
            },
        ],
        "totalCount": 5,
        "page": 1,
        "pageSize": 30,
        "timestamp": "2025-05-08T18:17:46.280Z"
    }
}
```

## 缓存机制

API 实现了 30 秒的缓存机制，相同的请求在 30 秒内将直接返回缓存的结果，减少 API 调用次数。


