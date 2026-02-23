import { Request, Response } from 'express';
import { Item } from '../types/item';

// 메모리 저장소 (실제 프로젝트에서는 DB 사용)
const items: Item[] = [
  { id: '1', name: '샘플 항목 1', description: '첫 번째 항목' },
  { id: '2', name: '샘플 항목 2', description: '두 번째 항목' },
];

export const getItems = (_req: Request, res: Response) => {
  res.json(items);
};

export const getItemById = (req: Request, res: Response) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  }
  res.json(item);
};

export const createItem = (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name은 필수이며 문자열이어야 합니다.' });
  }
  const id = String(Date.now());
  const newItem: Item = { id, name, description: description || '' };
  items.push(newItem);
  res.status(201).json(newItem);
};

export const updateItem = (req: Request, res: Response) => {
  const index = items.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  }
  const { name, description } = req.body;
  if (name !== undefined) items[index].name = name;
  if (description !== undefined) items[index].description = description;
  res.json(items[index]);
};

export const deleteItem = (req: Request, res: Response) => {
  const index = items.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  }
  const deleted = items.splice(index, 1)[0];
  res.json({ message: '삭제됨', item: deleted });
};
