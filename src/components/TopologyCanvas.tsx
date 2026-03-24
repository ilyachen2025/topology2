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
  BUS_1: 425,
  HOSTS: 675,
  DCDC: 1075,
  BUS_2: 1325,
  TERMINALS: 1575
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
  let currentX = 400; // Left padding increased to prevent text cutoff

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

  const hasValidStorage = config.storageSystem && (
    (config.storageSystem.batteryPower && parseFloat(config.storageSystem.batteryPower) > 0) ||
    (config.storageSystem.equipmentPower && parseFloat(config.storageSystem.equipmentPower) > 0) ||
    (config.storageSystem.dcdcPower && parseFloat(config.storageSystem.dcdcPower) > 0) ||
    (config.storageSystem.fastChargerPower && parseFloat(config.storageSystem.fastChargerPower) > 0) ||
    (config.storageSystem.fastChargerQuantity > 0)
  );

  if (hasValidStorage) {
    const branchWidth = Math.max(config.storageSystem!.fastChargerQuantity * TERMINAL_SLOT, 600);
    branches.push({
      type: 'storage_system',
      data: config.storageSystem,
      x: currentX,
      width: branchWidth,
      centerX: currentX + branchWidth / 2
    });
    currentX += branchWidth + 120;
  }

  // Calculate exact total width needed (400 left padding + branches + 400 right padding - 120 extra gap)
  const totalWidth = branches.length > 0 ? currentX - 120 + 400 : 1200;
  
  const transformerX = branches.length > 0 
    ? (branches[0].centerX + branches[branches.length - 1].centerX) / 2 
    : totalWidth / 2;

  return (
    <div ref={ref} className="relative bg-white mx-auto" style={{ width: totalWidth, height: 1900 }}>
      {/* Lines Layer */}
      <svg className="absolute inset-0 pointer-events-none" width={totalWidth} height={1900}>
        {/* Transformer to Bus 1 */}
        <line x1={transformerX} y1={LEVEL_Y.TRANSFORMER + 80} x2={transformerX} y2={LEVEL_Y.BUS_1} stroke="#333" strokeWidth="3" />

        {/* Bus 1 */}
        {branches.length > 0 && (
          <line
            x1={Math.min(transformerX, branches[0].centerX)}
            y1={LEVEL_Y.BUS_1}
            x2={Math.max(transformerX, branches[branches.length - 1].centerX)}
            y2={LEVEL_Y.BUS_1}
            stroke="#333"
            strokeWidth="3"
          />
        )}

        {branches.map((branch, i) => {
          if (branch.type === 'group_charger') {
            const gc = branch.data as GroupChargerConfig;
            const startX = branch.centerX - ((gc.terminalQuantity - 1) * TERMINAL_SLOT) / 2;
            const isIntegrated = gc.terminalQuantity === 0 || 
                                 (gc.hostName && (gc.hostName.includes('一体机') || gc.hostName.includes('双枪'))) ||
                                 (gc.terminalName && gc.terminalName.includes('一体机'));
            // Align bottoms: host height is 280 (half is 140), terminal height is 260 (half is 130).
            // To align bottoms at 1430 (1300 + 130), host center should be at 1430 - 140 = 1290.
            const hostY = isIntegrated ? LEVEL_Y.TERMINALS - 10 : LEVEL_Y.HOSTS;

            return (
              <g key={`gc-${i}`}>
                {/* Bus 1 to Host */}
                <line x1={branch.centerX} y1={LEVEL_Y.BUS_1} x2={branch.centerX} y2={hostY - 110} stroke="#333" strokeWidth="3" />
                {/* Host to Bus 2 */}
                {!isIntegrated && gc.terminalQuantity > 0 && (
                  <line x1={branch.centerX} y1={LEVEL_Y.HOSTS + 110} x2={branch.centerX} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                )}
                {/* Bus 2 */}
                {!isIntegrated && gc.terminalQuantity > 1 && (
                  <line x1={startX} y1={LEVEL_Y.BUS_2} x2={startX + (gc.terminalQuantity - 1) * TERMINAL_SLOT} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                )}
                {/* Bus 2 to Terminals */}
                {!isIntegrated && Array.from({ length: gc.terminalQuantity }).map((_, j) => {
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
                {ss.fastChargerQuantity > 0 && (
                  <line x1={branch.centerX} y1={LEVEL_Y.DCDC + 110} x2={branch.centerX} y2={LEVEL_Y.BUS_2} stroke="#333" strokeWidth="3" />
                )}
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
          const isIntegrated = gc.terminalQuantity === 0 || 
                               (gc.hostName && (gc.hostName.includes('一体机') || gc.hostName.includes('双枪'))) ||
                               (gc.terminalName && gc.terminalName.includes('一体机'));
          const hostY = isIntegrated ? LEVEL_Y.TERMINALS - 10 : LEVEL_Y.HOSTS;

          return (
            <React.Fragment key={`gc-nodes-${i}`}>
              <DeviceNode
                x={branch.centerX}
                y={hostY}
                image={images.group_charger}
                fallback={<GroupChargerIcon />}
                label={gc.power}
                subLabel={gc.hostName || '群控主机'}
                labelPos="left"
                width={200}
                height={280}
                objectFit="fill"
              />
              {!isIntegrated && Array.from({ length: gc.terminalQuantity }).map((_, j) => {
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
              {!isIntegrated && gc.terminalQuantity > 0 && (
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
              )}
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
              {ss.fastChargerQuantity > 0 && (
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
              )}
            </React.Fragment>
          );
        }
        return null;
      })}
    </div>
  );
});

TopologyCanvas.displayName = 'TopologyCanvas';
