/* NOMCONEXIA-UNIFY */
import { api } from "./apiServices";

export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  phone: string;
  category: string;
  status: string;
  lastUpdate: string;
  position?: TraccarPosition;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  fixTime: string;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  course: number;
  address: string;
}

export const traccarService = {
  getDevices: async (): Promise<TraccarDevice[]> => {
    const response = await api.get("/api/Traccar/devices/positions");
    return response.data;
  },

  getDevicePosition: async (deviceId: number): Promise<TraccarPosition> => {
    const response = await api.get(`/api/Traccar/devices/${deviceId}/position`);
    return response.data;
  },

  getDeviceHistory: async (deviceId: number, from: string, to: string): Promise<TraccarPosition[]> => {
    const response = await api.get(`/api/Traccar/devices/${deviceId}/history`, {
      params: { from, to }
    });
    return response.data;
  }
};