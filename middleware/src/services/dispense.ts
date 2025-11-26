import mqttService from './mqttService'
import {db} from "./firebase"

interface PlanItem {
  magazineId: number;
  magazineName: string;
  amount: number;
}

export interface Plan{
  amounts: PlanItem[];
  timestamp: string;
}

interface DispenseHistoryItem{
    timestamp: number; 
    amounts: PlanItem[];
    status: 'COMPLETED' | 'ERROR';
    type: 'Manual Dispense' | 'Scheduled Dispense';
}

export async function dispense(plan : Plan, manual: boolean = true) {
    const ack = await mqttService.publishAndWaitForAck("01", "dispense", plan, "medbox/01/dispensed");
    console.log(`💊 DISPENSING HARDWARE: ${JSON.stringify(plan)}`);
    console.log("Dispensing successful:", ack);
    const item : DispenseHistoryItem = {
        timestamp: Date.now(),
        amounts: plan.amounts,
        status: ack? 'COMPLETED' : 'ERROR',
        type: manual? 'Manual Dispense' : 'Scheduled Dispense'
    };
    db.collection('history').add(item);
}