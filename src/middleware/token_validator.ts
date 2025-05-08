import { Request, Response, NextFunction } from 'express';
import { isValidWalletAddress, isSupportedNetwork } from '../utils/validators';
import { AddressUtils } from '../utils/address.utils';

/**
 * 验证查询参数中的网络和地址中间件
 * 验证网络是否支持以及钱包地址是否有效
 */
export const verifyQueryNetworkAndAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { network, address } = req.query;

  // 验证参数是否存在
  if (!network || !address) {
    res.status(400).json({
      success: false,
      message: '网络和钱包地址参数必须提供'
    });
    return;
  }

  // 验证网络是否支持
  if (!isSupportedNetwork(network as string)) {
    res.status(400).json({
      success: false,
      message: `不支持的网络: ${network}`
    });
    return;
  }

  // 验证钱包地址格式
  if (!isValidWalletAddress(address as string)) {
    res.status(400).json({
      success: false,
      message: '无效的钱包地址格式'
    });
    return;
  }

  // 格式化地址为标准格式（校验和格式）
  req.query.address = (address as string).toLowerCase();

  // 验证通过，继续处理请求
  next();
};
