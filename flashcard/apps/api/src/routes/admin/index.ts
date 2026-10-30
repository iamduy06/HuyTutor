import { Router } from 'express';
import adminUsersRouter from './adminUsers.routes.js';
import adminDecksRouter from './adminDecks.routes.js';
import adminGroupsRouter from './adminGroups.routes.js';
import adminSubadminsRouter from './adminSubadmins.routes.js';
import adminSystemRouter from './adminSystem.routes.js';

const router = Router();

router.use(adminUsersRouter);
router.use(adminDecksRouter);
router.use(adminGroupsRouter);
router.use(adminSubadminsRouter);
router.use(adminSystemRouter);

export default router;
