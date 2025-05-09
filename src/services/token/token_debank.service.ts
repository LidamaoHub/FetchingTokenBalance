import axios from 'axios';
import { TokenInfo } from '../../types';

// 这个方法主要是基于 DeBank API 来获取代币余额信息

export default class TokenServiceDebank {
  // DeBank 支持的网络映射及其对应的 chain_id
  private static readonly networkChainIds: Record<string, string> = {
    eth: 'eth',         // 以太坊主网
    polygon: 'polygon',  // Polygon
    bsc: 'bsc',         // BNB Chain (BSC)
    arbitrum: 'arbitrum', // Arbitrum
    optimism: 'op',     // Optimism
    base: 'base',       // Base
    avalanche: 'avax',  // Avalanche
    zksync: 'zksync',   // zkSync
    zkera: 'zkera',     // zkEra
    linea: 'linea',     // Linea
    scroll: 'scroll'    // Scroll
  };

  /**
   * 获取钱包的代币余额列表
   * @param network 网络类型
   * @param address 钱包地址
   * @returns 代币余额信息和总数
   */
  static async getTokenBalances(
    network: string,
    address: string
  ): Promise<{ tokens: TokenInfo[], totalCount: number }> {
    try {
      const apiKey = process.env.DEBANK_API_KEY;
     

      const chainId = this.getChainId(network);
      if (!chainId) {
        throw new Error(`DeBank 不支持的网络: ${network}`);
      }

      // 使用 DeBank API 获取代币余额
      const url = `https://pro-openapi.debank.com/v1/user/token_list?id=${address}&chain_id=${chainId}`;
      
      const response = await axios.get(url, {
        headers: {
          'AccessKey': apiKey
        }
      });

      if (!response.data) {
        throw new Error('获取 DeBank 代币余额数据失败');
      }

      // 转换为 TokenInfo 格式
      const tokens: TokenInfo[] = response.data
        .filter((token: any) => token.id && token.id !== 'eth') // 过滤掉原生代币
        .map((token: any) => {
          // DeBank 返回的余额已经是实际值，需要转换为带小数位的字符串格式
          // 例如，如果代币有18位小数，DeBank返回的是1.5，我们需要转换为1.5 * 10^18 = 1500000000000000000
          const decimals = token.decimals || 18;
          let balance = '0';
          
          if (token.amount) {
            try {
              // 将浮点数转换为BigInt字符串
              const amountFloat = parseFloat(token.amount.toString());
              if (!isNaN(amountFloat) && isFinite(amountFloat)) {
                // 计算 amount * 10^decimals
                const multiplier = BigInt(10) ** BigInt(decimals);
                const amountInWei = BigInt(Math.floor(amountFloat * Number(multiplier)));
                balance = amountInWei.toString();
              }
            } catch (error) {
              console.warn(`无法转换代币余额: ${token.symbol}`, error);
            }
          }
          
          return {
            contractAddress: token.id,
            symbol: token.symbol || '未知',
            name: token.name || '未知代币',
            decimals: decimals,
            logo: token.logo_url || null,
            balance: balance
          };
        });

      return {
        tokens,
        totalCount: tokens.length
      };
    } catch (error) {
      console.error('通过 DeBank 获取代币余额失败:', error);
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }

  /**
   * 获取带分页的代币余额列表
   * @param network 网络类型
   * @param address 钱包地址
   * @param pageSize 每页数量
   * @param page 页码
   * @returns 代币余额信息和总数
   */
  static async getTokenBalancesWithPagination(
    network: string,
    address: string,
    pageSize: number = 30,
    page: number = 1
  ): Promise<{ tokens: TokenInfo[], totalCount: number }> {
    try {
      const result = await this.getTokenBalances(network, address);
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        tokens: result.tokens.slice(startIndex, endIndex),
        totalCount: result.tokens.length
      };
    } catch (error) {
      console.error('通过 DeBank 获取分页代币余额失败:', error);
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }

  /**
   * 根据网络名称获取对应的 chain_id
   * @param network 网络名称
   * @returns 对应的 chain_id，如果不支持返回 null
   */
  private static getChainId(network: string): string | null {
    const networkLower = network.toLowerCase();
    return this.networkChainIds[networkLower] || null;
  }
}
