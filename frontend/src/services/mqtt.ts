export const simulateMqttPublish = (topic: string, payload: any): Promise<boolean> => {
  console.log(`[MQTT PUBLISH] Topic: ${topic}`, payload);
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 500);
  });
};