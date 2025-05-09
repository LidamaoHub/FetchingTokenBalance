import { Request, Response, NextFunction } from 'express';
import TokenService from '../../services/token/token.service';
import TokenServiceMoralis from '../../services/token/token_moralis.service';
import TokenServiceDune from '../../services/token/token_dune.service';
import TokenServiceDebank from '../../services/token/token_debank.service';
import TokenAggregatorService from '../../services/token/token_aggregator.service';
import { CustomRequest, WalletParams, WalletTokensResponse, ApiResponse, TokenQueryParams, TokenInfo } from '../../types';
import TokenServiceBSC from '../../services/token/token_bsc.service';


class TokenController {

  // 获取钱包的 ERC20 代币余额，支持内存分页
   
  static async getTokenBalancesWithPagination(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response<ApiResponse<WalletTokensResponse>> | void> {
    try {
      const { address, network } = req.query as unknown as TokenQueryParams;
      
      const page = parseInt(req.query.page as string || '1', 10);
      let pageSize = parseInt(req.query.pageSize as string || '30', 10);
      
      // 限制每页最大数量为50
      if (pageSize > 50) pageSize = 50;
      if (pageSize < 1) pageSize = 30;
      if (page < 1) pageSize = 1;
      
      // 使用聚合服务，自动备用机制
      const result = await TokenAggregatorService.getTokenBalancesWithPagination(
        network,
        address,
        pageSize,
        page
      );

      // 返回结果
      return res.json({
        success: true,
        data: {
          address,
          network,
          tokens: result.tokens,
          totalCount: result.totalCount,
          page,
          pageSize,
          timestamp: new Date().toISOString(),
          dataSource: result.dataSource || 'Unknown',
          processingTime: result.processingTime || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TokenController;
