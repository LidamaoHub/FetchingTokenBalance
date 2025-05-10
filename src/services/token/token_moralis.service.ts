import axios from 'axios';
import { TokenInfo } from '../../types';

// 这个方法主要是基于 Moralis API 来获取代币余额信息

export default class TokenServiceMoralis {
  // 服务名称，用于数据源标识
  public static readonly serviceName: string = 'Moralis';
  
  // Moralis 支持的网络映射
  private static readonly networkMap: Record<string, string> = {
    eth: 'eth',
    polygon: 'polygon',
    bsc: 'bsc',
    arbitrum: 'arbitrum',
    avalanche: 'avalanche',
    fantom: 'fantom',
    cronos: 'cronos',
    optimism: 'optimism',
    base: 'base'
  };

 // 获取带分页的代币余额列表
  
  static async getTokenBalancesWithPagination(
    network: string,
    address: string,
    pageSize: number = 30,
    page: number = 1
  ): Promise<{ tokens: TokenInfo[], totalCount: number }> {
    try {
      const apiKey = process.env.MORALIS_API_KEY;
    

      const chainId = this.getChainId(network);
      if (!chainId) {
        throw new Error(`不支持的网络: ${network}`);
      }

      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20`;
      const response = await axios.get(url, {
        params: {
          chain: this.networkMap[network.toLowerCase()],
          limit: pageSize,
          offset: (page - 1) * pageSize
        },
        headers: {
          'X-API-Key': apiKey
        }
      });

      const tokens: TokenInfo[] = response.data.map((token: any) => ({
        contractAddress: token.token_address,
        symbol: token.symbol || '未知',
        name: token.name || '未知代币',
        decimals: parseInt(token.decimals, 10) || 18,
        logo: null,
        balance: token.balance || '0'
      }));

      const totalResponse = await axios.get(url, {
        params: {
          chain: this.networkMap[network.toLowerCase()],
          limit: 1
        },
        headers: {
          'X-API-Key': apiKey,
          'X-Moralis-Total': 'true'
        }
      });

      const totalCount = parseInt(totalResponse.headers['x-moralis-total-count'] || '0', 10);

      return {
        tokens,
        totalCount: totalCount || tokens.length
      };
    } catch (error) {
      console.error('通过 Moralis 获取代币余额失败:', error);
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }

  // 根据网络名称获取链 ID

  private static getChainId(network: string): string | null {
    const networkLower = network.toLowerCase();
    if (!this.networkMap[networkLower]) {
      return null;
    }
    return this.networkMap[networkLower];
  }
}
