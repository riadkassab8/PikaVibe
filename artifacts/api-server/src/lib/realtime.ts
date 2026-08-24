import type { Response } from "express";

export type NewOrderEvent = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
    notes: string;
  };
  createdAt: string;
};

const adminClients = new Set<Response>();

export function addAdminRealtimeClient(response: Response) {
  adminClients.add(response);
  response.write(": connected\n\n");
  return () => adminClients.delete(response);
}

export function emitNewOrder(order: NewOrderEvent) {
  const payload = `event: new_order\ndata: ${JSON.stringify(order)}\n\n`;
  for (const client of adminClients) {
    try {
      client.write(payload);
    } catch {
      adminClients.delete(client);
    }
  }
}

export function startAdminRealtimeHeartbeat(response: Response) {
  const heartbeat = setInterval(() => {
    try {
      response.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);
  return () => clearInterval(heartbeat);
}
