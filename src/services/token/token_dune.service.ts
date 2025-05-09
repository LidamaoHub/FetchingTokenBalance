import axios from 'axios';
import { TokenInfo } from '../../types';

// 这个方法主要是基于 Dune Analytics API 来获取代币余额信息

export default class TokenServiceDune {
  // Dune 支持的网络映射及其对应的 chain_id
  private static readonly networkChainIds: Record<string, number> = {
    eth: 1,        
    polygon: 137,    
    bsc: 56,        
    arbitrum: 42161, 
    optimism: 10,    
    base: 8453,      
  };

  // 获取钱包的代币余额列表
  
  static async getTokenBalances(
    network: string,
    address: string
  ): Promise<{ tokens: TokenInfo[], totalCount: number }> {
    try {
      const apiKey = process.env.DUNE_API_KEY;

      const chainId = this.getChainId(network);
      if (!chainId) {
        throw new Error(`Dune 不支持的网络: ${network}`);
      }

      const url = `https://api.dune.com/api/echo/v1/balances/evm/${address}?chain_ids=${chainId}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-dune-api-key': apiKey
        }
      });

      if (!response.data || !response.data.balances) {
        throw new Error('获取 Dune 代币余额数据失败');
      }
      console.log(response.data)

      // 转换为 TokenInfo 格式
      const tokens: TokenInfo[] = response.data.balances
        .filter((balance: any) => balance.address && balance.address !== 'native') // 只包含代币，不包含原生代币
        .map((balance: any) => ({
          contractAddress: balance.address,
          symbol: balance.symbol || '未知',
          name: balance.name || '未知代币',
          decimals: balance.decimals || 18,
          logo: null,
          balance: balance.amount || '0'
        }));
        
      // 处理原生代币（ETH）
      const nativeToken = response.data.balances.find((balance: any) => balance.address === 'native');
      if (nativeToken) {
        tokens.unshift({
          contractAddress: '0x0000000000000000000000000000000000000000', // 原生代币的合约地址用 0x0
          symbol: nativeToken.symbol || 'ETH',
          name: nativeToken.symbol || 'Ethereum',
          decimals: nativeToken.decimals || 18,
          logo: null,
          balance: nativeToken.amount || '0'
        });
      }

      return {
        tokens,
        totalCount: tokens.length
      };
    } catch (error) {
      console.error('通过 Dune 获取代币余额失败:', error);
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }

  // 获取带分页的代币余额列表
  
  static async getTokenBalancesWithPagination(
    network: string,
    address: string,
    pageSize: number = 30,
    page: number = 1
  ): Promise<{ tokens: TokenInfo[], totalCount: number }> {
    try {
      // 由于 Dune API 本身不支持分页，我们需要获取所有数据然后在内存中分页
      const result = await this.getTokenBalances(network, address);
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTokens = result.tokens.slice(startIndex, endIndex);
      
      return {
        tokens: paginatedTokens,
        totalCount: result.tokens.length
      };
    } catch (error) {
      console.error('通过 Dune 获取分页代币余额失败:', error);
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }

  // 根据网络名称获取对应的 chain_id
 
  private static getChainId(network: string): number | null {
    const networkLower = network.toLowerCase();
    return this.networkChainIds[networkLower] || null;
  }
}
