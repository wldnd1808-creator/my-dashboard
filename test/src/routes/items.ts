import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/items';

export const itemsRouter = Router();

itemsRouter.get('/', getItems);
itemsRouter.get('/:id', getItemById);
itemsRouter.post('/', createItem);
itemsRouter.put('/:id', updateItem);
itemsRouter.delete('/:id', deleteItem);
