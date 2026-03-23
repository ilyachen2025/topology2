import React, { useRef, forwardRef } from 'react';
import { StationConfig, DeviceImages, GroupChargerConfig, StorageSystemConfig } from '../types';
import {
  TransformerIcon,
  GroupChargerIcon,
  BatteryCabinetIcon,
  EquipmentCabinetIcon,
  DCDCCabinetIcon,
  SplitChargerIcon,
  FastChargerIcon
} from './icons';

interface Props {
  config: StationConfig;
  images: DeviceImages;
}

const TERMINAL_WIDTH = 160;
const TERMINAL_GAP = 80;
const TERMINAL_SLOT = TERMINAL_WIDTH + TERMINAL_GAP;

const LEVEL_Y = {
  TRANSFORMER: 200,
  BUS_1: 450,
  HOSTS: 800,
  DCDC: 1200,
  BUS_2: 1450,
  TERMINALS: 1700
};

function DeviceNode({ x, y, image, fallback, label, subLabel, width = 120, height = 150, labelPos = 'bottom', imageOffsetX = 0, imageScale = 1, objectFit = 'contain' }: any) {
  return (
    <div style={{ left: x - width / 2, top: y - height / 2, width, height }} className="absolute flex flex-col items-center justify-center">
      <div className="w-full h-full relative flex items-center justify-center" style={{ transform: `translateX(${imageOffsetX}px)` }}>
        {image ? (
          <img src={image} alt={label} className="w-full h-full" style={{ objectFit, transform: `scale(${imageScale})` }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ transform: `scale(${imageScale})` }}>{fallback}</div>
        )}
      </div>

      {labelPos === 'bottom' && (label || subLabel) && (
        <div className="absolute top-full mt-6 text-center whitespace-nowrap">
          <div className="text-3xl font-bold text-gray-800">{label}</div>
          {subLabel && <div className="text-2xl font-bold text-gray-500 mt-2">{subLabel}</div>}
        </div>
      )}
      {labelPos === 'left' && (label || subLabel) && (
        <div className="absolute right-full mr-10 text-right whitespace-nowrap top-1/2 -translate-y-1/2">
          <div className="text-3xl font-bold text-gray-800">{label}</div>
          {subLabel && <div className="text-2xl font-bold text-gray-800 mt-2">{subLabel}</div>}
        </div>
      )}
      {labelPos === 'right' && (label || subLabel) && (
        <div className="absolute left-full ml-10 text-left whitespace-nowrap top-1/2 -translate-y-1/2">
          <div className="text-3xl font-bold text-gray-800">{label}</div>
          {subLabel && <div className="text-2xl font-bold text-gray-800 mt-2">{subLabel}</div>}
        </div>
      )}
    </div>
  );
}

export const TopologyCanvas = forwardRef<HTMLDivElement, Props>(({ config, images }, ref) => {
  const branches: any[] = [];
  let currentX = 225; // Left padding

  config.groupChargers.forEach((gc, gcIndex) => {
    for (let i = 0; i < gc.quantity; i++) {
      const branchWidth = Math.max(gc.terminalQuantity * TERMINAL_SLOT, 300);
      branches.push({
        type: 'group_charger',
        data: gc,
        index: i,
        x: currentX,
        width: branchWidth,
        centerX: currentX + branchWidth / 2
      });
      currentX += branchWidth + 120; // Gap between branches
    }
  });

  if (config.storageSystem) {
    const branchWidth = Math.max(config.storageSystem.fastChargerQuantity * TERMINAL_SLOT, 600);
    branches.push({
      type: 'storage_system',
      data: config.storageSystem,
      x: currentX,
      width: branchWidth,
      centerX: currentX + branchWidth / 2
    });
    currentX += branchWidth + 120;
  }

  const totalWidth = Math.max(currentX, 1200);
  const transformerX = totalWidth / 2;

  return (
    <div ref={ref} className="relative bg-white" style={{ width: totalWidth, height: 2000 }}>
      {/* Lines Layer */}
      <svg className="absolute inset-0 pointer-events-none" width={totalWidth} height={2000}>
        {/* Transformer to Bus 1 */}
        <line x1={transformerX} y1={LEVEL_Y.TRANSFORMER + 80} x2={transformerX} y2={LEVEL_Y.BUS_1} stroke="#333" strokeWidth="3" />

        {/* Bus 1 */}
        {branches.length > 0 && (
          <line x1={branches[0].centerX} y1={LEVEL_Y.BUS_1} x2={branches[branches.length - 1].centerX} y2={LEVEL_Y.BUS_1} stroke="#333" strokeWidth="3" />
        )}

        {branches.map((branch, i) => {
          if (branch.type === 'group_charger') {
            const gc = branch.data as GroupChargerConfig;
            const startX = branch.centerX - ((gc.terminalQuantity - 1) * TERMINAL_SLOT) / 2;

            return (
              <g key={`gc-${i}`}>
                {/* Bus 1 to Host */}
                <line x1={branch.centerX} y1={LEVEL_Y.BUS_1} x2={branch.centerX} y2={LEVEL_Y.HOSTS - 110} stroke="#333" strokeWidth="3" />
                {/* Host to Bus 2 */}
                <line x1={branch.centerX} y1={LEVEL_Y.HOSTS + 110} x2={branch.centerX} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                {/* Bus 2 */}
                {gc.terminalQuantity > 1 && (
                  <line x1={startX} y1={LEVEL_Y.BUS_2} x2={startX + (gc.terminalQuantity - 1) * TERMINAL_SLOT} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                )}
                {/* Bus 2 to Terminals */}
                {Array.from({ length: gc.terminalQuantity }).map((_, j) => {
                  const tx = startX + j * TERMINAL_SLOT;
                  return <line key={j} x1={tx} y1={LEVEL_Y.BUS_2} x2={tx} y2={LEVEL_Y.TERMINALS - 100} stroke="#333" strokeWidth="3" />
                })}
              </g>
            );
          } else if (branch.type === 'storage_system') {
            const ss = branch.data as StorageSystemConfig;
            const startX = branch.centerX - ((ss.fastChargerQuantity - 1) * TERMINAL_SLOT) / 2;

            return (
              <g key={`ss-${i}`}>
                {/* Bus 1 to Equipment Cabinet */}
                <line x1={branch.centerX} y1={LEVEL_Y.BUS_1} x2={branch.centerX} y2={LEVEL_Y.HOSTS - 110} stroke="#333" strokeWidth="3" />
                {/* Equipment to DCDC */}
                <line x1={branch.centerX} y1={LEVEL_Y.HOSTS + 110} x2={branch.centerX} y2={LEVEL_Y.DCDC - 110} stroke="#333" strokeWidth="3" />
                {/* DCDC to Bus 2 */}
                <line x1={branch.centerX} y1={LEVEL_Y.DCDC + 110} x2={branch.centerX} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                {/* Bus 2 */}
                {ss.fastChargerQuantity > 1 && (
                  <line x1={startX} y1={LEVEL_Y.BUS_2} x2={startX + (ss.fastChargerQuantity - 1) * TERMINAL_SLOT} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                )}
                {/* Bus 2 to Terminals */}
                {Array.from({ length: ss.fastChargerQuantity }).map((_, j) => {
                  const tx = startX + j * TERMINAL_SLOT;
                  return <line key={j} x1={tx} y1={LEVEL_Y.BUS_2} x2={tx} y2={LEVEL_Y.TERMINALS - 100} stroke="#333" strokeWidth="3" />
                })}
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* Nodes Layer */}
      {/* Transformer */}
      <DeviceNode
        x={transformerX}
        y={LEVEL_Y.TRANSFORMER}
        image={images.transformer}
        fallback={<TransformerIcon />}
        label={config.transformerName}
        labelPos="right"
        width={160}
        height={220}
      />

      {/* Branches Nodes */}
      {branches.map((branch, i) => {
        if (branch.type === 'group_charger') {
          const gc = branch.data as GroupChargerConfig;
          const startX = branch.centerX - ((gc.terminalQuantity - 1) * TERMINAL_SLOT) / 2;

          return (
            <React.Fragment key={`gc-nodes-${i}`}>
              <DeviceNode
                x={branch.centerX}
                y={LEVEL_Y.HOSTS}
                image={images.group_charger}
                fallback={<GroupChargerIcon />}
                label={gc.power}
                subLabel="群控主机"
                labelPos="left"
                width={200}
                height={280}
                objectFit="fill"
              />
              {Array.from({ length: gc.terminalQuantity }).map((_, j) => {
                const tx = startX + j * TERMINAL_SLOT;
                return (
                  <DeviceNode
                    key={j}
                    x={tx}
                    y={LEVEL_Y.TERMINALS}
                    image={images.split_charger}
                    fallback={<SplitChargerIcon />}
                    width={160}
                    height={260}
                    objectFit="fill"
                  />
                );
              })}
              {/* Label for terminals */}
              <div
                className="absolute text-3xl text-gray-800 font-bold text-center"
                style={{
                  left: branch.centerX - 225,
                  top: LEVEL_Y.TERMINALS + 160,
                  width: 450
                }}
              >
                {gc.terminalName}*{gc.terminalQuantity}
              </div>
            </React.Fragment>
          );
        } else if (branch.type === 'storage_system') {
          const ss = branch.data as StorageSystemConfig;
          const startX = branch.centerX - ((ss.fastChargerQuantity - 1) * TERMINAL_SLOT) / 2;

          return (
            <React.Fragment key={`ss-nodes-${i}`}>
              {/* Battery Cabinet */}
              <DeviceNode
                x={branch.centerX - 300}
                y={LEVEL_Y.HOSTS}
                image={images.battery_cabinet}
                fallback={<BatteryCabinetIcon />}
                label={ss.batteryPower}
                subLabel="电池柜"
                labelPos="left"
                width={200}
                height={280}
              />
              {/* Plus Sign */}
              <div
                className="absolute text-8xl text-teal-400 font-light"
                style={{
                  left: branch.centerX - 150,
                  top: LEVEL_Y.HOSTS,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                +
              </div>
              {/* Equipment Cabinet */}
              <DeviceNode
                x={branch.centerX}
                y={LEVEL_Y.HOSTS}
                image={images.equipment_cabinet}
                fallback={<EquipmentCabinetIcon />}
                label={ss.equipmentPower}
                subLabel="设备柜"
                labelPos="right"
                width={200}
                height={280}
              />
              {/* DCDC Cabinet */}
              <DeviceNode
                x={branch.centerX}
                y={LEVEL_Y.DCDC}
                image={images.dcdc_cabinet}
                fallback={<DCDCCabinetIcon />}
                label={ss.dcdcPower}
                subLabel="DCDC柜"
                labelPos="right"
                width={200}
                height={280}
              />
              {/* Fast Chargers */}
              {Array.from({ length: ss.fastChargerQuantity }).map((_, j) => {
                const tx = startX + j * TERMINAL_SLOT;
                return (
                  <DeviceNode
                    key={j}
                    x={tx}
                    y={LEVEL_Y.TERMINALS}
                    image={images.fast_charger}
                    fallback={<FastChargerIcon />}
                    width={160}
                    height={260}
                    imageOffsetX={20}
                  />
                );
              })}
              {/* Label for fast chargers */}
              <div
                className="absolute text-3xl text-gray-800 font-bold text-center"
                style={{
                  left: branch.centerX - 225,
                  top: LEVEL_Y.TERMINALS + 160,
                  width: 450
                }}
              >
                {ss.fastChargerPower}{ss.fastChargerName}*{ss.fastChargerQuantity}
              </div>
            </React.Fragment>
          );
        }
        return null;
      })}
    </div>
  );
});

TopologyCanvas.displayName = 'TopologyCanvas';
