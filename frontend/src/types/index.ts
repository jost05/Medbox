import { Timestamp } from 'firebase/firestore'

export interface DispenseEvent {
  _id: string;
  type: 'Manual Dispense' | 'Scheduled Dispense';
  magazineName: string;
  magazineId: number;
  scheduledAt: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt?: Timestamp;
}
