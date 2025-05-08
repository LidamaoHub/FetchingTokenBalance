import { ethers } from 'ethers';

// 钱包地址工具类
export class AddressUtils {
  /**
   * 验证钱包地址是否有效
   * @param address 待验证的钱包地址
   * @returns 是否是有效的钱包地址
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * 格式化钱包地址为标准格式
   * @param address 原始钱包地址
   * @returns 格式化后的钱包地址，如果地址无效则返回原地址
   */
  static formatAddress(address: string): string {
    try {
      if (!this.isValidAddress(address)) {
        return address;
      }
      return ethers.getAddress(address); 
    } catch (error) {
      console.error('格式化钱包地址失败:', error);
      return address;
    }
  }
}
