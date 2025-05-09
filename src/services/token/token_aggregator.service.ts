import { TokenInfo } from '../../types';
import TokenService from './token.service';
import TokenServiceMoralis from './token_moralis.service';
import TokenServiceDune from './token_dune.service';
import TokenServiceDebank from './token_debank.service';
import TokenServiceBSC from './token_bsc.service';

 // 代币API服务聚合器,傻瓜式配置

export default class TokenAggregatorService {
  // 定义每个网络的服务优先级
  private static readonly servicePriority: Record<string, Array<(network: string, address: string) => Promise<{ tokens: TokenInfo[], totalCount: number }>>> = {
    eth: [
      (network, address) => TokenService.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDune.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address)
    ],
    polygon: [
      (network, address) => TokenService.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDune.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address)
    ],
    bsc: [
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceBSC.getTokenBalances(network, address)
    ],
    arbitrum: [
      (network, address) => TokenService.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address)
    ],
    optimism: [
      (network, address) => TokenService.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address)
    ],
    base: [
      (network, address) => TokenService.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address),
      (network, address) => TokenServiceDebank.getTokenBalancesWithPagination(network, address)
    ]
  };

  // 默认服务优先级
  private static readonly defaultServicePriority = [
    (network: string, address: string) => TokenServiceDebank.getTokenBalancesWithPagination(network, address),
    (network: string, address: string) => TokenServiceMoralis.getTokenBalancesWithPagination(network, address)
  ];

  
  // 获取代币余额，自动 fallback 到备用服务
  
  static async getTokenBalances(
    network: string,
    address: string
  ): Promise<{ tokens: TokenInfo[], totalCount: number, dataSource?: string, processingTime?: number }> {
    const startTime = Date.now();
    const networkLower = network.toLowerCase();
    const services = this.servicePriority[networkLower] || this.defaultServicePriority;
    
    let lastError: Error | null = null;
    let dataSource = '';
    
    // 尝试按优先级调用每个服务
    for (let i = 0; i < services.length; i++) {
      const serviceFunc = services[i];
      try {
        console.log(`尝试使用服务获取 ${networkLower} 网络的代币余额...`);
        const result = await serviceFunc(network, address);
        
        // 检查结果是否有效
        if (result && result.tokens && result.tokens.length > 0) {
          console.log(`成功获取 ${result.tokens.length} 个代币余额`);
          
          // 根据服务函数的索引确定数据来源
          if (i === 0) {
            if (networkLower === 'bsc') {
              dataSource = 'BSC';
            } else if (['eth', 'polygon', 'arbitrum', 'optimism', 'base'].includes(networkLower)) {
              dataSource = 'Alchemy';
            } else {
              dataSource = 'DeBank';
            }
          } else if (i === 1) {
            if (['eth', 'polygon'].includes(networkLower)) {
              dataSource = 'Dune';
            } else if (networkLower === 'bsc') {
              dataSource = 'Moralis';
            } else {
              dataSource = 'Moralis';
            }
          } else if (i === 2) {
            dataSource = 'Moralis';
          } else {
            dataSource = 'DeBank';
          }
          
          // 添加数据来源到每个代币
          const tokensWithSource = result.tokens.map(token => ({
            ...token,
            dataSource
          }));
          
          const endTime = Date.now();
          const processingTime = endTime - startTime;
          
          return {
            tokens: tokensWithSource,
            totalCount: result.tokens.length,
            dataSource,
            processingTime
          };
        } else {
          console.warn(`服务返回了空结果，尝试下一个服务`);
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`服务调用失败: ${(error as Error).message}，尝试下一个服务`);
      }
    }
    
    // 所有服务都失败，返回空结果并记录最后一个错误
    console.error(`所有服务都失败，最后错误: ${lastError?.message || '未知错误'}`);
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    return {
      tokens: [],
      totalCount: 0,
      dataSource: 'None',
      processingTime
    };
  }


   //获取带分页的代币余额列表
  
  static async getTokenBalancesWithPagination(
    network: string,
    address: string,
    pageSize: number = 30,
    page: number = 1
  ): Promise<{ tokens: TokenInfo[], totalCount: number, dataSource?: string, processingTime?: number }> {
    const paginationStartTime = Date.now();
    try {
      
      // 获取所有代币
      const result = await this.getTokenBalances(network, address);
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      // 计算分页处理时间
      const paginationEndTime = Date.now();
      const paginationTime = paginationEndTime - paginationStartTime;
      
      // 如果原始请求已有处理时间，则加上分页时间
      const processingTime = result.processingTime ? result.processingTime + (paginationEndTime - paginationStartTime) : paginationTime;
      
      return {
        tokens: result.tokens.slice(startIndex, endIndex),
        totalCount: result.tokens.length,
        dataSource: result.dataSource,
        processingTime
      };
    } catch (error) {
      console.error('获取分页代币余额失败:', error);
      const endTime = Date.now();
      const processingTime = endTime - paginationStartTime;
      
      return {
        tokens: [],
        totalCount: 0,
        dataSource: 'None',
        processingTime
      };
    }
  }
}
