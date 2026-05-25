import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { rlsLocalStorage } from '../rls.patch';

@Injectable()
export class RlsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Initialize the RLS context with default values
    rlsLocalStorage.run({ condominiumId: null, bypassRls: false }, () => {
      next();
    });
  }
}
