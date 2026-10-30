import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import meRouter from './me.routes.js';
import decksRouter from './decks.routes.js';
import gameRouter from './game.routes.js';
import progressRouter from './progress.routes.js';
import subadminRouter from './subadmin.routes.js';
import adminRouter from './admin/index.js';

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(meRouter);
apiRouter.use(decksRouter);
apiRouter.use(gameRouter);
apiRouter.use(progressRouter);
apiRouter.use(subadminRouter);
apiRouter.use(adminRouter);

export default apiRouter;
