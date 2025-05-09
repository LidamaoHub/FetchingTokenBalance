import { AddressUtils } from './address.utils';

/**
 * 验证工具函数
 * 提供常用的验证函数，避免在控制器中重复编写验证逻辑
 */

/**
 * 验证钱包地址格式
 * 使用 ethers.js 的 isAddress 方法验证地址
 * @param address 钱包地址
 * @returns 是否是有效的钱包地址
 */
export const isValidWalletAddress = (address: string): boolean => {
  return AddressUtils.isValidAddress(address);
};

/**
 * 支持的网络列表
 */
export const SUPPORTED_NETWORKS = [
  'eth',
  'goerli',
  'sepolia',
  'polygon',
  'mumbai',
  'arbitrum',
  'optimism',
  'base',
  'bsc'
];

/**
 * 验证网络是否支持
 * @param network 网络标识符
 * @returns 是否是支持的网络
 */
export const isSupportedNetwork = (network: string): boolean => {
  console.log(network,network.toLowerCase())
  return SUPPORTED_NETWORKS.includes(network.toLowerCase());
};

/**
 * 解析分页大小参数
 * @param pageSizeParam 分页大小参数
 * @param defaultSize 默认分页大小
 * @param maxSize 最大分页大小
 * @returns 解析后的分页大小
 */
export const parsePageSize = (
  pageSizeParam: string | undefined,
  defaultSize: number = 100,
  maxSize: number = 500
): number => {
  if (!pageSizeParam) {
    return defaultSize;
  }
  
  const parsedSize = parseInt(pageSizeParam, 10);
  
  if (isNaN(parsedSize) || parsedSize <= 0) {
    return defaultSize;
  }
  
  return Math.min(parsedSize, maxSize);
};
