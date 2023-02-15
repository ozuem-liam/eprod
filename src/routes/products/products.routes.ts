import { Router } from '../../types/app';
import {
    getProducts,
    addProduct,
    updateProduct,
    getProductByIdOrSlug,
    deleteAProduct,
} from '../../controllers';

const router = Router();

router.post('/', addProduct);
router.get('/:id_or_slug', getProductByIdOrSlug);
router.put('/:id', updateProduct);
router.get('/', getProducts);
router.delete('/:id', deleteAProduct);


export default router;
