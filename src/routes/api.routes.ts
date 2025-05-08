import express, { Router } from 'express';
import TokenController from '../controllers/token/token';
import NftController from '../controllers/nft/nft.controller';
import cacheMiddleware from '../middleware/cache.middleware';
import { verifyQueryNetworkAndAddress } from '../middleware/token_validator';

const router: Router = express.Router();

// erc20
router.get(
  '/token',
  verifyQueryNetworkAndAddress,
  cacheMiddleware(),
  TokenController.getTokenBalancesWithPagination
);

// nft
router.get(
  '/nft',
  verifyQueryNetworkAndAddress,
  cacheMiddleware(),
  NftController.getNftListWithPagination
);

export default router;
