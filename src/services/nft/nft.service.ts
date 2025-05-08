import { Alchemy, Network, OwnedNft, OwnedNftsResponse, GetNftsForOwnerOptions } from 'alchemy-sdk';
import { NftInfo } from '../../types';

/**
 * NFT 服务
 * 提供与 NFT 相关的功能，包括获取 NFT 列表等
 */
class NftService {
  /**
   * 网络映射
   */
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

  /**
   * 获取指定网络的 Alchemy 实例
   * @param {string} network - 网络标识符（如 eth, polygon 等）
   * @returns {Alchemy} Alchemy 实例
   * @throws {Error} 如果网络不支持则抛出错误
   */
  static getAlchemyInstance(network: string): Alchemy {
    // 检查网络是否支持
    if (!this.networkMap[network.toLowerCase()]) {
      throw new Error(`不支持的网络: ${network}`);
    }

    // 创建 Alchemy 配置
    const settings = {
      apiKey: process.env.ALCHEMY_API_KEY || '',
      network: this.networkMap[network.toLowerCase()]
    };

    // 返回 Alchemy 实例
    return new Alchemy(settings);
  }

  /**
   * 获取钱包的 NFT 列表
   * @param {string} network - 网络标识符
   * @param {string} address - 钱包地址
   * @param {number} pageSize - 每页数量，默认为 100
   * @param {string} pageKey - 分页键，用于获取下一页数据
   * @returns {Promise<{nfts: NftInfo[], pageKey?: string, totalCount: number}>} NFT 列表、下一页键和总数
   */
  static async getNftList(
    network: string, 
    address: string, 
    pageSize: number = 100, 
    pageKey?: string
  ): Promise<{nfts: NftInfo[], pageKey?: string, totalCount: number}> {
    try {
      // 获取 Alchemy 实例
      const alchemy = this.getAlchemyInstance(network);

      // 设置获取 NFT 的选项
      const options: GetNftsForOwnerOptions = {
        pageSize,
        excludeFilters: [], // 不排除任何 NFT
      };

      // 如果有分页键，添加到选项中
      if (pageKey) {
        options.pageKey = pageKey;
      }

      // 获取 NFT 列表
      const nftsResponse: OwnedNftsResponse = await alchemy.nft.getNftsForOwner(address, options);

      // 转换 NFT 数据格式
      const nfts: NftInfo[] = nftsResponse.ownedNfts.map((nft: OwnedNft) => {
        // 处理 NFT 属性
        const attributes = nft.rawMetadata?.attributes || [];
        const formattedAttributes = Array.isArray(attributes) 
          ? attributes.map(attr => ({
              trait_type: attr.trait_type || '',
              value: attr.value || ''
            }))
          : [];

        return {
          tokenId: nft.tokenId,
          contractAddress: nft.contract.address,
          name: nft.title || '未知 NFT',
          description: nft.description || '',
          tokenType: nft.tokenType,
          tokenUri: nft.tokenUri?.raw || null,
          image: {
            originalUrl: nft.media[0]?.raw || null,
            thumbnailUrl: nft.media[0]?.thumbnail || null,
            format: nft.media[0]?.format || null
          },
          attributes: formattedAttributes,
          collection: {
            name: nft.contract.name || null,
            slug: nft.contract.openSea ? String(nft.contract.openSea) : null
          }
        };
      });

      return {
        nfts,
        pageKey: nftsResponse.pageKey,
        totalCount: nftsResponse.totalCount
      };
    } catch (error) {
      console.error('获取 NFT 列表失败:', error);
      throw error;
    }
  }
}

export default NftService;
