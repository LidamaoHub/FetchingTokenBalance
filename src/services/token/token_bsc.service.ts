import { TokenInfo } from '../../types';
import * as ethers from 'ethers';
import path from 'path';
import fs from 'fs';
import { MULTICALL_ABI } from '../../abi/multicall.abi';
import { ERC20_ABI } from '../../abi/erc20.abi';

// 这个方法主要是尝试使用"热门代币"配合rpc方案获取BSC等alchemy无索引的资产列表(其实用morails api能实现bsc的信息获取)
// 功能仅做某些特殊链的极端情况展示,完全不依赖第三方api来实现
// 单纯演示

export default class TokenServiceBSC {
  // 服务名称，用于数据源标识
  public static readonly serviceName: string = 'BSC';
 
  static async getTokenBalances(network: string, address: string): Promise<{tokens: TokenInfo[],  totalCount: number}>{
    try {
      
      const BSC_RPC_URL = process.env.BSC_RPC_URL;
      const MULTICALL_ADDRESS = '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb';
      const BATCH_SIZE = process.env.BATCH_SIZE ;

      console.log("BSC_RPC_URL",BSC_RPC_URL)

      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      
      // 创建 Multicall 合约实例
      const multicallContract = new ethers.Contract(
        MULTICALL_ADDRESS,
        MULTICALL_ABI,
        provider
      );
      
      // 从文件中读取热门代币列表
      const tokensFilePath = path.join(__dirname, '../../utils/bnb_tokens.json');
      let tokens = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
      // 确保代币列表中包含必要的属性
      tokens = tokens.map((token: any) => ({
        address: token.address,
        name: token.name || '未知代币',
        symbol: token.symbol || token.name || '未知',
        decimals: token.decimals || 18
      }));
      
      // 分批处理代币并准备并发请求
      const batchPromises: Promise<TokenInfo[]>[] = [];
      
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / Number(BATCH_SIZE)) + 1;
        console.log(`准备处理第 ${batchIndex} 批，共 ${batchTokens.length} 个代币`);
        
        // 创建一个异步函数来处理每一批代币
        const batchPromise = (async (): Promise<TokenInfo[]> => {
          try {
            // 构建调用数据
            const calls = batchTokens.map((token: any) => {
              const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
              const callData = tokenContract.interface.encodeFunctionData('balanceOf', [address]);
              return {
                target: token.address,
                callData,
              };
            });
            
            // 执行批量调用
            const [, returnData] = await multicallContract.aggregate(calls);
            
            // 解析返回数据
            const batchResults = returnData.map((data: string, index: number) => {
              const tokenContract = new ethers.Contract(batchTokens[index].address, ERC20_ABI, provider);
              const decoded = tokenContract.interface.decodeFunctionResult('balanceOf', data);
              const balance = decoded[0].toString();
              
              // 只返回余额大于0的代币
              if (balance !== '0') {
                return {
                  contractAddress: batchTokens[index].address,
                  symbol: batchTokens[index].symbol || '未知',
                  name: batchTokens[index].name || '未知代币',
                  decimals: batchTokens[index].decimals || 18,
                  logo: null,
                  balance: balance
                };
              }
              return null;
            }).filter((item: any): item is TokenInfo => item !== null); // 过滤掉null值
            
            console.log(`第 ${batchIndex} 批处理完成，找到 ${batchResults.length} 个有余额的代币`);
            return batchResults;
          } catch (err) {
            console.error(`处理第 ${batchIndex} 批代币时发生错误:`, err);
            return [];
          }
        })();
        
        batchPromises.push(batchPromise);
      }
      
      // 并发执行所有批次请求
      const batchResults = await Promise.all(batchPromises);
      const allBalances: TokenInfo[] = batchResults.flat();
      
      return {
        tokens: allBalances,
        totalCount: allBalances.length
      };
    } catch (error: any) {
      console.error('获取BSC网络代币余额失败:', error);
      // 发生错误时返回空数组
      return {
        tokens: [],
        totalCount: 0
      };
    }
  }
}

