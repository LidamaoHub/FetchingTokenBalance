import { TokenInfo } from '../../types';
import TokenService from './token.service';
import TokenServiceMoralis from './token_moralis.service';
import TokenServiceDune from './token_dune.service';
import TokenServiceDebank from './token_debank.service';
import TokenServiceBSC from './token_bsc.service';
import { ServiceAlert } from '../../utils/serviceAlert';
import { AdTokenBlocker } from '../../utils/adTokenBlocker';

 // 代币API服务聚合器,傻瓜式配置

export default class TokenAggregatorService {
  // 定义每个网络的服务优先级
  private static readonly servicePriority: Record<string, Array<any>> = {
    eth: [
      TokenService,
      TokenServiceDune,
      TokenServiceMoralis,
      TokenServiceDebank
    ],
    polygon: [
      TokenService,
      TokenServiceDune,
      TokenServiceMoralis,
      TokenServiceDebank
    ],
    bsc: [
      TokenServiceMoralis,
      TokenServiceDebank,
      TokenServiceBSC
    ],
    arbitrum: [
      TokenService,
      TokenServiceMoralis,
      TokenServiceDebank
    ],
    optimism: [
      TokenService,
      TokenServiceMoralis,
      TokenServiceDebank
    ],
    base: [
      TokenService,
      TokenServiceMoralis,
      TokenServiceDebank
    ]
  };

  // 默认服务优先级
  private static readonly defaultServicePriority = [
    TokenServiceDebank,
    TokenServiceMoralis
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
    
    for (let i = 0; i < services.length; i++) {
      const ServiceClass = services[i];
      try {
        console.log(`尝试使用 ${ServiceClass.serviceName} 服务获取 ${networkLower} 网络的代币余额...`);
        
        let result;
        if (ServiceClass === TokenServiceBSC) {
          result = await ServiceClass.getTokenBalances(network, address);
        } else {
          result = await ServiceClass.getTokenBalancesWithPagination(network, address);
        }
        
        // 检查结果是否有效
        if (result && result.tokens && result.tokens.length > 0) {
          console.log(`成功使用 ${ServiceClass.serviceName} 获取 ${result.tokens.length} 个代币余额`);
          
          dataSource = ServiceClass.serviceName;
          
          const endTime = Date.now();
          const processingTime = endTime - startTime;
          
          return {
            tokens: result.tokens,
            totalCount: result.tokens.length,
            dataSource,
            processingTime
          };
        } else {
          console.warn(`服务返回了空结果，尝试下一个服务`);
        }
      } catch (error) {
        lastError = error as Error;
        // 使用ServiceAlert发送API渠道故障警报
        ServiceAlert.logApiFailure(ServiceClass.serviceName, network, address, error);
      }
    }
    
    // 所有服务都失败，返回空结果并发送警报
    ServiceAlert.logApiFailure('AllServices', network, address, lastError || '所有服务都失败，无具体错误信息');
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
    page: number = 1,
    filterZeroBalance: boolean = false,
    filterAdToken: boolean = true
  ): Promise<{ tokens: TokenInfo[], totalCount: number, dataSource?: string, processingTime?: number }> {
    const paginationStartTime = Date.now();
    try {
      
      // 获取所有代币
      const result = await this.getTokenBalances(network, address);
      
      // 先过滤广告代币（如果需要）
      let filteredTokens = result.tokens;
      if (filterAdToken) {
        filteredTokens = AdTokenBlocker.filterAdTokens(filteredTokens);
      }
      
      // 如果需要过滤零资产
      if (filterZeroBalance) {
        filteredTokens = filteredTokens.filter(token => {
          // 过滤掉余额为0的代币
          return token.balance !== '0' && token.balance !== '';
        });
      }
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      // 计算分页处理时间
      const paginationEndTime = Date.now();
      const paginationTime = paginationEndTime - paginationStartTime;
      
      // 如果原始请求已有处理时间，则加上分页时间
      const processingTime = result.processingTime ? result.processingTime + (paginationEndTime - paginationStartTime) : paginationTime;
      
      return {
        tokens: filteredTokens.slice(startIndex, endIndex),
        totalCount: filteredTokens.length,
        dataSource: result.dataSource,
        processingTime
      };
    } catch (error) {
      ServiceAlert.logApiFailure('getTokenBalancesWithPagination', network, address, error);
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
