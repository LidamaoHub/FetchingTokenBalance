import { TokenInfo } from '../types';

// 广告代币过滤器
export class AdTokenBlocker {
  // 域名检测正则表达式  检测字符串.字符串格式 类似FF9.io等,一般这种都不是正经域名且不带https标,所以直接按照 string.string匹配
  private static readonly DOMAIN_PATTERN = /\S+\.\S+/i;
  
  // 常见广告代币关键词
  private static readonly SUSPICIOUS_KEYWORDS = [
    'airdrop', 'free'
  ];
  
  /**
   * 检查代币是否为广告代币
   * @param token 代币信息
   * @returns 如果是广告代币返回true，否则返回false
   */
  public static isAdToken(token: TokenInfo): boolean {
    // 如果没有名称或符号，无法判断
    if (!token.name || !token.symbol) {
      return false;
    }
    
    const name = token.name.toLowerCase();
    const symbol = token.symbol.toLowerCase();
    
    // 1. 检查是否包含域名格式（如FF9.io）
    if (this.DOMAIN_PATTERN.test(name) || this.DOMAIN_PATTERN.test(symbol)) {
      return true;
    }
    
    // 2. 检查是否包含广告关键词,这里可能还得修改,因为可能会误伤正常token
    for (const keyword of this.SUSPICIOUS_KEYWORDS) {
      if (symbol.includes(keyword) || name.includes(keyword)) {
        return true;
      }
    }
    
    // 3. 检查符号长度是否异常
    if (symbol.length > 10) { // 正常代币符号通常不超过10个字符
      return true;
    }
    
    return false;
  }
  
  /**
   * 过滤掉列表中的广告代币
   * @param tokens 代币列表
   * @returns 过滤后的代币列表
   */
  public static filterAdTokens(tokens: TokenInfo[]): TokenInfo[] {
    return tokens.filter(token => !this.isAdToken(token));
  }
  
}
