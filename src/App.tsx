import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as htmlToImage from 'html-to-image';
import { Download, Upload, Wand2, Settings, Image as ImageIcon, X } from 'lucide-react';
import { StationConfig, DeviceImages } from './types';
import { TopologyCanvas } from './components/TopologyCanvas';

const DEFAULT_PROMPT = "2套720KW群充带6个分体式双枪直流充电桩外机，1套186KWh电池柜、300KW 设备柜，360KWDCDC柜，DCDC柜下面接4个180kW快充（单枪）";

const defaultConfig: StationConfig = {
  transformerName: '变压器#1',
  groupChargers: [
    {
      id: '1',
      hostName: '群控主机',
      power: '720kW',
      quantity: 2,
      terminalName: '分体式双枪直流充电桩外机',
      terminalQuantity: 6
    }
  ],
  storageSystem: {
    batteryPower: '186kWh',
    equipmentPower: '300kW',
    dcdcPower: '360kW',
    fastChargerPower: '180kW',
    fastChargerQuantity: 4,
    fastChargerName: '快充桩'
  }
};

const defaultImages: DeviceImages = {
  transformer: null,
  group_charger: null,
  battery_cabinet: null,
  equipment_cabinet: null,
  dcdc_cabinet: null,
  split_charger: null,
  fast_charger: null
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    groupChargers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hostName: { type: Type.STRING },
          power: { type: Type.STRING },
          quantity: { type: Type.INTEGER },
          terminalName: { type: Type.STRING },
          terminalQuantity: { type: Type.INTEGER }
        },
        required: ["hostName", "power", "quantity", "terminalName", "terminalQuantity"]
      }
    },
    storageSystem: {
      type: Type.OBJECT,
      properties: {
        batteryPower: { type: Type.STRING },
        equipmentPower: { type: Type.STRING },
        dcdcPower: { type: Type.STRING },
        fastChargerPower: { type: Type.STRING },
        fastChargerQuantity: { type: Type.INTEGER },
        fastChargerName: { type: Type.STRING }
      },
      required: ["batteryPower", "equipmentPower", "dcdcPower", "fastChargerPower", "fastChargerQuantity", "fastChargerName"]
    }
  }
};

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [config, setConfig] = useState<StationConfig>(defaultConfig);
  const [images, setImages] = useState<DeviceImages>(defaultImages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'config' | 'images'>('ai');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('deviceImages');
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to parse saved images', e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `Parse the following description of a solar-storage-charging station topology into JSON.
CRITICAL INSTRUCTIONS:
1. If the description explicitly states there is no storage system (光储充系统) or battery cabinet, or if it's not mentioned at all, you MUST omit the storageSystem field entirely (do not include it in the JSON).
2. If a host has no terminals (e.g., "下面不带终端"), set terminalQuantity to 0.
3. Do not hallucinate values. If a value is not mentioned, use "0" or 0.
4. Extract the host name (e.g., "群控主机", "双枪均分一体机") into hostName. If not specified, default to "群控主机".
Description: ${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1
        }
      });
      
      const parsed = JSON.parse(response.text);
      
      let storageSystem = parsed.storageSystem || null;
      if (storageSystem) {
        const checkFields = ['batteryPower', 'equipmentPower', 'dcdcPower', 'fastChargerPower', 'fastChargerQuantity'];
        const hasValidValues = checkFields.some(field => {
          const v = storageSystem[field];
          if (typeof v === 'string') {
            const num = parseFloat(v);
            return !isNaN(num) && num > 0;
          }
          if (typeof v === 'number') {
            return v > 0;
          }
          return false;
        });
        if (!hasValidValues) {
          storageSystem = null;
        }
      }

      if (!storageSystem) {
        storageSystem = {
          batteryPower: '',
          equipmentPower: '',
          dcdcPower: '',
          fastChargerPower: '',
          fastChargerQuantity: 0,
          fastChargerName: '快充桩'
        };
      }
      
      setConfig({
        transformerName: '变压器#1',
        groupChargers: parsed.groupChargers.map((gc: any, i: number) => ({ ...gc, id: String(i) })) || [],
        storageSystem
      });
    } catch (error) {
      console.error("Failed to parse description:", error);
      alert("解析失败，请检查输入格式或稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error('Failed to export image:', err);
      alert("生成图片失败");
    }
  };

  const handleImageUpload = (key: keyof DeviceImages) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImages(prev => {
          const newImages = { ...prev, [key]: base64String };
          localStorage.setItem('deviceImages', JSON.stringify(newImages));
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImages = () => {
    if (confirm('确定要清除所有自定义设备图片吗？')) {
      setImages(defaultImages);
      localStorage.removeItem('deviceImages');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            光储充拓扑图生成器
          </h1>
        </div>

        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('ai')}
          >
            <div className="flex items-center justify-center gap-1"><Wand2 className="w-4 h-4" /> AI生成</div>
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('config')}
          >
            <div className="flex items-center justify-center gap-1"><Settings className="w-4 h-4" /> 手动配置</div>
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'images' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('images')}
          >
            <div className="flex items-center justify-center gap-1"><ImageIcon className="w-4 h-4" /> 设备图片</div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述您的站点配置</label>
                <textarea
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：2套720KW群充带6个分体式双枪直流充电桩外机..."
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 解析中...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> 自动生成拓扑图</>
                )}
              </button>
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-semibold mb-1">提示：</p>
                <p>输入设备的功率、数量，AI会自动解析并更新拓扑图。您可以在"设备图片"中上传自定义的设备外观。</p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">充电系统 (群充/一体机)</h3>
                {config.groupChargers.map((gc, i) => (
                  <div key={gc.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3 space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">主机名称</label>
                        <input type="text" value={gc.hostName || '群控主机'} onChange={e => {
                          const newGc = [...config.groupChargers];
                          newGc[i].hostName = e.target.value;
                          setConfig({...config, groupChargers: newGc});
                        }} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">主机功率</label>
                        <input type="text" value={gc.power} onChange={e => {
                          const newGc = [...config.groupChargers];
                          newGc[i].power = e.target.value;
                          setConfig({...config, groupChargers: newGc});
                        }} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                      <div className="w-16">
                        <label className="block text-xs text-gray-500 mb-1">数量</label>
                        <input type="number" value={gc.quantity} onChange={e => {
                          const newGc = [...config.groupChargers];
                          newGc[i].quantity = parseInt(e.target.value) || 0;
                          setConfig({...config, groupChargers: newGc});
                        }} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">终端名称</label>
                        <input type="text" value={gc.terminalName} onChange={e => {
                          const newGc = [...config.groupChargers];
                          newGc[i].terminalName = e.target.value;
                          setConfig({...config, groupChargers: newGc});
                        }} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">终端数/机</label>
                        <input type="number" value={gc.terminalQuantity} onChange={e => {
                          const newGc = [...config.groupChargers];
                          newGc[i].terminalQuantity = parseInt(e.target.value) || 0;
                          setConfig({...config, groupChargers: newGc});
                        }} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {config.storageSystem && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">光储充系统</h3>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">电池柜容量</label>
                        <input type="text" value={config.storageSystem.batteryPower} onChange={e => setConfig({...config, storageSystem: {...config.storageSystem!, batteryPower: e.target.value}})} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">设备柜功率</label>
                        <input type="text" value={config.storageSystem.equipmentPower} onChange={e => setConfig({...config, storageSystem: {...config.storageSystem!, equipmentPower: e.target.value}})} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">DCDC柜功率</label>
                        <input type="text" value={config.storageSystem.dcdcPower} onChange={e => setConfig({...config, storageSystem: {...config.storageSystem!, dcdcPower: e.target.value}})} className="w-full p-1.5 text-sm border rounded" />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">快充桩功率</label>
                          <input type="text" value={config.storageSystem.fastChargerPower} onChange={e => setConfig({...config, storageSystem: {...config.storageSystem!, fastChargerPower: e.target.value}})} className="w-full p-1.5 text-sm border rounded" />
                        </div>
                        <div className="w-20">
                          <label className="block text-xs text-gray-500 mb-1">数量</label>
                          <input type="number" value={config.storageSystem.fastChargerQuantity} onChange={e => setConfig({...config, storageSystem: {...config.storageSystem!, fastChargerQuantity: parseInt(e.target.value) || 0}})} className="w-full p-1.5 text-sm border rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500 mb-4 flex-1">上传您自己的设备图片以替换默认图标。图片会自动保存在您的浏览器中。</p>
                <button 
                  onClick={handleClearImages}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded bg-red-50 ml-2 whitespace-nowrap"
                >
                  清除全部
                </button>
              </div>
              
              {[
                { key: 'transformer', label: '变压器' },
                { key: 'group_charger', label: '主机 (群控/一体机)' },
                { key: 'split_charger', label: '分体式充电桩' },
                { key: 'battery_cabinet', label: '电池柜' },
                { key: 'equipment_cabinet', label: '设备柜' },
                { key: 'dcdc_cabinet', label: 'DCDC柜' },
                { key: 'fast_charger', label: '快充桩' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    {images[item.key as keyof DeviceImages] && (
                      <img src={images[item.key as keyof DeviceImages]!} alt="" className="w-8 h-8 object-contain" />
                    )}
                    <label className="cursor-pointer px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                      上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(item.key as keyof DeviceImages)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出图片
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden mx-auto" style={{ width: 'max-content' }}>
            <TopologyCanvas ref={canvasRef} config={config} images={images} />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">预览与下载</h3>
              <button onClick={() => setPreviewImage(null)} className="text-gray-500 hover:text-gray-800 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-gray-100 flex justify-center items-center">
              <img src={previewImage} alt="Topology Preview" className="max-w-full h-auto shadow-md" />
            </div>
            <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
              <p className="mb-3 text-base">请在上方图片上 <b>右键点击</b>（或长按）并选择 <b>“图片另存为...”</b> 来保存到本地。</p>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'topology.png';
                  link.href = previewImage;
                  link.click();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                尝试直接下载
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
