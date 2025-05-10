import { Request, Response, NextFunction } from 'express';


export type NetworkType = 
  | 'eth'
  | 'goerli'
  | 'sepolia'
  | 'polygon'
  | 'mumbai'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'bsc';


export interface TokenInfo {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string | null;
  balance: string;
}


export interface NftAttribute {
  trait_type: string;
  value: string | number;
}


export interface NftInfo {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  tokenType: string;
  tokenUri: string | null;
  image: {
    originalUrl: string | null;
    thumbnailUrl: string | null;
    format: string | null;
  };
  attributes: NftAttribute[];
  collection: {
    name: string | null;
    slug: string | null;
  };
}


export interface WalletParams {
  network: NetworkType;
  address: string;
}


export interface TokenQueryParams {
  address: string;
  network: NetworkType;
  page?: number;
  pageSize?: number;
  filterZeroBalance?: boolean;
}


export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}


export interface WalletTokensResponse {
  address: string;
  network: string;
  tokens: TokenInfo[];
  totalCount: number;
  page: number;
  pageSize: number;
  timestamp: string;
  dataSource?: string;
  processingTime?: number; // 处理数据所花的时间（毫秒）
}


export interface WalletNftsResponse {
  address: string;
  network: string;
  nfts: NftInfo[];
  pageKey?: string;
  totalCount: number;
  timestamp: string;
}


export interface CustomRequest<P = any, B = any> extends Request {
  params: P & Record<string, string>;
  body: B;
}


export type ControllerMethod = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any> | any;


export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
