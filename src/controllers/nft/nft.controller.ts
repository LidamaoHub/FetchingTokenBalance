import { Request, Response, NextFunction } from 'express';
import NftService from '../../services/nft/nft.service';
import { ApiResponse, WalletNftsResponse, TokenQueryParams } from '../../types';

class NftController {

 // 获取钱包的 NFT 列表
 // 当前版本仅做展示,因为nft设计多metada,所以实际上使用节点方案比较好,目前只支持非BSC的 api数据

  static async getNftListWithPagination(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response<ApiResponse<WalletNftsResponse>> | void> {
    try {
      const { address, network } = req.query as unknown as TokenQueryParams;
      
      const page = parseInt(req.query.page as string || '1', 10);
      let pageSize = parseInt(req.query.pageSize as string || '30', 10);
      
      // 限制每页最大数量为50
      if (pageSize > 50) pageSize = 50;
      if (pageSize < 1) pageSize = 30;
      if (page < 1) pageSize = 1;
      
      // 获取 NFT 列表
      const { nfts, pageKey: nextPageKey, totalCount } = await NftService.getNftList(
        network, 
        address, 
        pageSize, 
        undefined
      );
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, nfts.length);
      const paginatedNfts = nfts.slice(startIndex, endIndex);

      return res.json({
        success: true,
        data: {
          address,
          network,
          nfts: paginatedNfts,
          totalCount,
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

export default NftController;
