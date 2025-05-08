import { Request, Response, NextFunction } from 'express';
import TokenService from '../../services/token/token.service';
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
      
      let result;
      if (network.toLowerCase() === 'bsc') {
        // BSC 网络使用multicall方案
        const allTokens = (await TokenServiceBSC.getTokenBalances(network, address)).tokens;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTokens = allTokens.slice(startIndex, endIndex);
        
        result = {
          tokens: paginatedTokens,
          totalCount: allTokens.length
        };
      } else {
        // 其他网络使用alchemy sdk 内存分页方法
        result = await TokenService.getTokenBalancesWithPagination(network, address, pageSize, page);
      }

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
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TokenController;
