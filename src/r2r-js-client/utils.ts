import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

export function generateRunId(): string {
  return uuidv4();
}

export function generateIdFromLabel(label: string): string {
  return uuidv5(label, uuidv5.DNS);
}
