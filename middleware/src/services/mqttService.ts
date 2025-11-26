import mqtt, { MqttClient, IClientOptions } from 'mqtt';

class MqttService {
  private client: MqttClient | null = null;
  private static instance: MqttService;

  private constructor() {}

  // Singleton pattern to ensure only one connection exists
  public static getInstance(): MqttService {
    if (!MqttService.instance) {
      MqttService.instance = new MqttService();
    }
    return MqttService.instance;
  }

  public connect(host: string, port: number, username?: string, password?: string): void {
    const connectUrl = `mqtt://${host}:${port}`;

    const options: IClientOptions = {
      clean: true, // clean session
      connectTimeout: 4000, 
      username: username,
      password: password,
      reconnectPeriod: 1000, // Retry every 1s if lost
    };

    console.log(`Connecting to MQTT Broker at ${connectUrl}...`);
    
    this.client = mqtt.connect(connectUrl, options);

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected');
      // Subscribe to topics here if this service also needs to LISTEN
      this.client?.subscribe('medbox/+/events'); 
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      this.client?.end();
    });
  }

  public publishAndWaitForAck(boxId: string, command: string, payload: object, ackTopic: string, timeout: number = 15000): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!this.client || !this.client.connected) {
            return reject('MQTT Client not connected.');
        }

        const onMessage = (topic: string, message: Buffer) => {
            if (topic === ackTopic) {
                //  message on this topic is the ack
                this.client?.removeListener('message', onMessage);
                this.client?.unsubscribe(ackTopic);
                resolve(message.toString());
            }
        };
        
        this.client?.subscribe(ackTopic, (err) => {
            if (err) {
                return reject(`Failed to subscribe to ${ackTopic}`);
            }
            
            this.client?.on('message', onMessage);

            const topic = `medbox/${boxId}/${command}`;
            this.client?.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
                if (err) {
                    this.client?.removeListener('message', onMessage);
                    this.client?.unsubscribe(ackTopic);
                    reject(`Failed to publish to ${topic}: ${err}`);
                } else {
                    console.log(`📤 Sent payload to ${topic}, waiting for ack on ${ackTopic}`);
                }
            });
        });

        setTimeout(() => {
            this.client?.removeListener('message', onMessage);
            this.client?.unsubscribe(ackTopic);
            reject('Acknowledgment timed out.');
        }, timeout);
    });
  }
}

export default MqttService.getInstance();