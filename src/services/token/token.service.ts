import { Alchemy, Network, TokenBalance, TokenBalancesResponse, TokenMetadataResponse, GetTokensForOwnerOptions } from 'alchemy-sdk';
import { TokenInfo } from '../../types';

// 这个方法主要是依赖alchemy SDK来实现常见链的资产获取,速度比较快,成本低

class TokenService {
  // 服务名称，用于数据源标识
  public static readonly serviceName: string = 'Alchemy';
  
  private static readonly networkMap: Record<string, Network> = {
    eth: Network.ETH_MAINNET,
    goerli: Network.ETH_GOERLI,
    sepolia: Network.ETH_SEPOLIA,
    polygon: Network.MATIC_MAINNET,
    mumbai: Network.MATIC_MUMBAI,
    arbitrum: Network.ARB_MAINNET,
    optimism: Network.OPT_MAINNET,
    base: Network.BASE_MAINNET
  };

  // 获取指定网络的 Alchemy 实例
  static getAlchemyInstance(network: string): Alchemy {
    if (!this.networkMap[network.toLowerCase()]) {
      throw new Error(`不支持的网络: ${network}`);
    }
    const settings = {
      apiKey: process.env.ALCHEMY_API_KEY || '',
      network: this.networkMap[network.toLowerCase()]
    };
    return new Alchemy(settings);
  }

  

  // 获取钱包的 ERC20 代币余额
 

  static async getTokenBalancesWithPagination(
    network: string, 
    address: string
  ): Promise<{tokens: TokenInfo[], pageKey?: string, totalCount: number}> {
    try {
      const alchemy = this.getAlchemyInstance(network);
      let allTokens: TokenInfo[] = [];
      let pageKey: string | undefined = undefined;
      let requestCount = 0;
      
      const options: GetTokensForOwnerOptions = {};
      // 最多轮询 3 次

      while (requestCount < 3) {
        if (pageKey) {
          options.pageKey = pageKey;
        }
        
        const tokensResponse = await alchemy.core.getTokensForOwner(address, options);
        requestCount++;
        const pageTokens: TokenInfo[] = tokensResponse.tokens
          .map(token => {
            // Alchemy 返回的余额已经是带小数位的字符串，但我们需要确保它是正确的
            // 如果 balance 包含小数点，则需要转换为完整的小数位数字
            const decimals = token.decimals || 18;
            let balance = token.balance || '0';
            
            // 检查是否需要处理小数点
            if (balance.includes('.')) {
              try {
                // 将浮点数转换为BigInt字符串
                const balanceFloat = parseFloat(balance);
                if (!isNaN(balanceFloat) && isFinite(balanceFloat)) {
                  // 计算 amount * 10^decimals
                  const multiplier = BigInt(10) ** BigInt(decimals);
                  const balanceInWei = BigInt(Math.floor(balanceFloat * Number(multiplier)));
                  balance = balanceInWei.toString();
                }
              } catch (error) {
                console.warn(`无法转换代币余额: ${token.symbol}`, error);
              }
            }
            
            return {
              contractAddress: token.contractAddress,
              symbol: token.symbol || '未知',
              name: token.name || '未知代币',
              decimals: decimals,
              logo: token.logo || null,
              balance: balance,
            };
          });
        
        allTokens = [...allTokens, ...pageTokens];
        pageKey = tokensResponse.pageKey;
        
        if (!pageKey) {
          break;
        }
      }
      return {
        tokens: allTokens,
        totalCount: allTokens.length
      };
    } catch (error) {
      console.error('获取代币余额失败:', error);
      throw error;
    }
  }
}

export default TokenService;
