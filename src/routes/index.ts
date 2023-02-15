import { Router } from '../types/app';
import products from './products/products.routes';
import logs from './app-logs/app-log.routes';


const router = Router();

router.use('/products', products);
router.use('/xp', logs);

export default router;