export type GroupChargerConfig = {
  id: string;
  hostName: string;
  power: string;
  quantity: number;
  terminalName: string;
  terminalQuantity: number;
};

export type StorageSystemConfig = {
  batteryPower: string;
  equipmentPower: string;
  dcdcPower: string;
  fastChargerPower: string;
  fastChargerQuantity: number;
  fastChargerName: string;
};

export type StationConfig = {
  transformerName: string;
  groupChargers: GroupChargerConfig[];
  storageSystem: StorageSystemConfig | null;
};

export type DeviceImages = {
  transformer: string | null;
  group_charger: string | null;
  battery_cabinet: string | null;
  equipment_cabinet: string | null;
  dcdc_cabinet: string | null;
  split_charger: string | null;
  fast_charger: string | null;
};
