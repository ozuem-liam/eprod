import { Router } from '../../types/app';
import { getLogs } from '../../controllers';

const router = Router();

router.get('/logs', getLogs);

export default router;