import express from 'express'

const router = express.Router();

import {addBook,deleteBook,showBooks,editBook,showBookId} from '../controllers/bookController.js'

router.post('/',addBook);
router.delete('/:id',deleteBook);
router.get('/',showBooks);
router.put('/:id',editBook);
router.get('/:id',showBookId);
export default router;