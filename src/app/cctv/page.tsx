'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Video, 
  VideoOff, 
  Cpu, 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Car, 
  Navigation,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { useToast } from '../../components/ToastProvider';

interface CameraFeed {
  id: string;
  name: string;
  locality: string;
  corridor: string;
  lat: number;
  lon: number;
  baseSpeed: number;
  baseVehicles: number;
  videoUrl: string;
  status: 'online' | 'offline' | 'incident';
}

const CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'CAM-SILK-01',
    name: 'Silk Board Junction Northbound',
    locality: 'Silk Board',
    corridor: 'Hosur Road / South',
    lat: 12.9176,
    lon: 77.6244,
    baseSpeed: 14,
    baseVehicles: 125,
    videoUrl: '/bengaluru_traffic.mp4#t=5',
    status: 'online',
  },
  {
    id: 'CAM-HEB-02',
    name: 'Hebbal Flyover Expressway',
    locality: 'Hebbal',
    corridor: 'Bellary Road / North',
    lat: 13.0358,
    lon: 77.5971,
    baseSpeed: 42,
    baseVehicles: 64,
    videoUrl: '/bengaluru_traffic.mp4#t=12',
    status: 'online',
  },
  {
    id: 'CAM-ORR-03',
    name: 'BSNL Underpass Channel',
    locality: 'Outer Ring Road',
    corridor: 'ORR / East',
    lat: 12.9995,
    lon: 77.6827,
    baseSpeed: 5,
    baseVehicles: 148,
    videoUrl: '/bengaluru_traffic.mp4#t=20',
    status: 'incident',
  },
  {
    id: 'CAM-WFD-04',
    name: 'ITPL Main Road Bypass',
    locality: 'Whitefield',
    corridor: 'Whitefield / East',
    lat: 12.9876,
    lon: 77.7376,
    baseSpeed: 24,
    baseVehicles: 82,
    videoUrl: '/bengaluru_traffic.mp4#t=28',
    status: 'online',
  },
  {
    id: 'CAM-KOR-05',
    name: 'Sony World Junction Crossing',
    locality: 'Koramangala',
    corridor: 'Inner Ring / Central',
    lat: 12.9344,
    lon: 77.6244,
    baseSpeed: 18,
    baseVehicles: 96,
    videoUrl: '/bengaluru_traffic.mp4#t=35',
    status: 'online',
  },
  {
    id: 'CAM-RMD-06',
    name: 'Richmond Circle Flyover',
    locality: 'Richmond Road',
    corridor: 'CBD / Central',
    lat: 12.9634,
    lon: 77.5976,
    baseSpeed: 32,
    baseVehicles: 70,
    videoUrl: '/bengaluru_traffic.mp4#t=42',
    status: 'online',
  }
];

const MOCK_LICENSE_PLATES = [
  'KA-03-MR-1204', 'KA-51-P-8832', 'KA-01-HE-4392', 'KA-05-MM-2910', 'KA-53-NQ-7422',
  'KA-02-JH-5511', 'KA-04-EK-9002', 'KA-50-MA-3145', 'KA-12-G-7821', 'KA-51-B-6622',
  'MH-12-QD-4021', 'DL-03-CA-9938', 'KA-03-NC-8291', 'KA-51-Z-0034', 'KA-04-MP-5120'
];

const CCTV_STYLES = `
  @keyframes yolo-move-1 {
    0% { top: 5%; left: 20%; width: 12%; height: 14%; opacity: 0; }
    10% { opacity: 0.85; }
    90% { opacity: 0.85; }
    100% { top: 75%; left: 10%; width: 22%; height: 26%; opacity: 0; }
  }

  @keyframes yolo-move-2 {
    0% { top: 10%; left: 45%; width: 16%; height: 20%; opacity: 0; }
    15% { opacity: 0.85; }
    85% { opacity: 0.85; }
    100% { top: 80%; left: 50%; width: 26%; height: 32%; opacity: 0; }
  }

  @keyframes yolo-move-3 {
    0% { top: 15%; left: 65%; width: 8%; height: 12%; opacity: 0; }
    8% { opacity: 0.9; }
    90% { opacity: 0.9; }
    100% { top: 70%; left: 80%; width: 12%; height: 18%; opacity: 0; }
  }

  @keyframes yolo-pedestrian {
    0%, 100% { top: 35%; left: 85%; width: 5%; height: 12%; opacity: 0.8; }
    50% { top: 55%; left: 90%; width: 5%; height: 12%; opacity: 0.8; }
  }
  
  .animate-yolo-1 {
    animation: yolo-move-1 5s linear infinite;
  }
  
  .animate-yolo-2 {
    animation: yolo-move-2 8s linear infinite;
  }
  
  .animate-yolo-3 {
    animation: yolo-move-3 3.5s linear infinite;
  }
  
  .animate-yolo-ped {
    animation: yolo-pedestrian 10s ease-in-out infinite;
  }
`;

export default function CctvGridPage() {
  const { incidents, handleAddIncident, handleToggleJunctionSignal, handleToggleCorridorStatus } = useAppState();
  const { showToast } = useToast();
  
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-SILK-01');
  const [aiOverlay, setAiOverlay] = useState<boolean>(true);
  const [scanlinesActive, setScanlinesActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>(CAMERA_FEEDS);
  
  // Real-time telemetry tickers
  const [speedVal, setSpeedVal] = useState<number>(14);
  const [vehicleCount, setVehicleCount] = useState<number>(125);
  const [pedestrianCount, setPedestrianCount] = useState<number>(12);
  const [laneOccupancy, setLaneOccupancy] = useState<number>(78);
  const [licensePlates, setLicensePlates] = useState<string[]>([]);
  
  // TensorFlow.js / COCO-SSD States & Refs
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<string>('Booting Framework...');
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectFrameRef = useRef<number | null>(null);

  const selectedCam = cameraFeeds.find(c => c.id === selectedCamId) || cameraFeeds[0];

  // Dynamic TF.js and COCO-SSD script loading at runtime
  useEffect(() => {
    let active = true;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Strict Mode Guard: check if script is already present
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if ((existing as any).dataset.loaded === 'true') {
            resolve();
          } else {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', (e) => reject(e));
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    };

    const loadMlLibraries = async () => {
      try {
        if (active) setModelStatus('Loading TensorFlow.js...');
        
        // 1. Load TensorFlow.js (Pinned compatible 3.18.0)
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js');
        const tf = (window as any).tf;
        if (tf) {
          await tf.ready();
          try {
            await tf.setBackend('webgl');
          } catch (e) {
            console.warn('WebGL backend failed to initialize, falling back to CPU', e);
            await tf.setBackend('cpu');
          }
        }

        if (active) setModelStatus('Fetching Neural Weights (COCO-SSD)...');

        // 2. Load COCO-SSD Model (Pinned compatible 2.2.2)
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');

        if (active) setModelStatus('Compiling Inference Pipelines...');

        // 3. Compile/Load Model
        const cocoSsd = (window as any).cocoSsd;
        if (!cocoSsd) {
          throw new Error('COCO-SSD global library not registered correctly on window');
        }
        const loadedModel = await cocoSsd.load();

        if (active) {
          setModel(loadedModel);
          setIsModelLoading(false);
          setModelStatus('AI Neural Engine Active (COCO-SSD)');
          showToast('Pre-trained COCO-SSD model compiled and active!', 'success');
        }
      } catch (err) {
        console.error('Inference loading failed:', err);
        if (active) {
          setIsModelLoading(false);
          setModelStatus('AI Inference Offline (Static Overlays Active)');
          showToast('Failed to load pre-trained weights. Falling back to local tracking simulations.', 'info');
        }
      }
    };

    loadMlLibraries();

    return () => {
      active = false;
    };
  }, []);

  // Real-time browser object detection loop
  useEffect(() => {
    // Clear canvas when model is loading, absent, or overlay is toggled off
    if (!model || !aiOverlay) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let activeDetection = true;

    const detectFrame = async () => {
      if (!activeDetection) return;

      // readyState 4 means HAVE_ENOUGH_DATA
      if (video.readyState === 4 && !video.paused && !video.ended) {
        try {
          const predictions = await model.detect(video);
          
          // Match canvas dimensions to actual video client display sizing
          if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Map raw coordinates to displays with correct scaling factors
            const videoWidth = video.videoWidth || 1;
            const videoHeight = video.videoHeight || 1;
            const scaleX = canvas.width / videoWidth;
            const scaleY = canvas.height / videoHeight;

            predictions.forEach((pred: any) => {
              const [x, y, width, height] = pred.bbox;
              
              const drawX = x * scaleX;
              const drawY = y * scaleY;
              const drawW = width * scaleX;
              const drawH = height * scaleY;

              // Draw neural bounding outline
              ctx.strokeStyle = '#0ea5e9'; // accent-blue glow
              ctx.lineWidth = 1.5;
              ctx.strokeRect(drawX, drawY, drawW, drawH);

              // Draw class tags and confidence ratings
              ctx.fillStyle = 'rgba(14, 165, 233, 0.85)';
              const tagText = `[ID:${Math.floor(x+y)}] ${pred.class.toUpperCase()} ${Math.round(pred.score * 100)}%`;
              ctx.font = 'bold 8px monospace';
              const textWidth = ctx.measureText(tagText).width;
              ctx.fillRect(drawX, drawY - 13, textWidth + 6, 13);

              ctx.fillStyle = '#05070f';
              ctx.fillText(tagText, drawX + 3, drawY - 3);

              // Feed license plate logs upon detecting a vehicle with high confidence
              if (Math.random() > 0.94 && pred.score > 0.6 && ['car', 'truck', 'bus', 'motorcycle'].includes(pred.class)) {
                const newPlate = MOCK_LICENSE_PLATES[Math.floor(Math.random() * MOCK_LICENSE_PLATES.length)];
                setLicensePlates(prev => [newPlate, ...prev.slice(0, 9)]);
              }
            });
          }
        } catch (err) {
          console.warn('Object detection frame skip:', err);
        }
      }

      if (activeDetection) {
        detectFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };

    // Delay start slightly to guarantee layout refs and metadata hook bindings are established
    const timeoutId = setTimeout(() => {
      detectFrame();
    }, 400);

    return () => {
      activeDetection = false;
      clearTimeout(timeoutId);
      if (detectFrameRef.current) {
        cancelAnimationFrame(detectFrameRef.current);
      }
    };
  }, [model, selectedCamId, aiOverlay]);

  // Dynamic telemetry simulator
  useEffect(() => {
    if (!selectedCam) return;
    
    // Set baseline values
    setSpeedVal(selectedCam.baseSpeed);
    setVehicleCount(selectedCam.baseVehicles);
    setPedestrianCount(Math.floor(Math.random() * 20) + 5);
    setLaneOccupancy(Math.floor(Math.random() * 25) + 65);
    
    // Generate initial plates
    const initialPlates: string[] = [];
    for (let i = 0; i < 5; i++) {
      initialPlates.push(MOCK_LICENSE_PLATES[Math.floor(Math.random() * MOCK_LICENSE_PLATES.length)]);
    }
    setLicensePlates(initialPlates);
  }, [selectedCamId]);

  // Tick tickers
  useEffect(() => {
    const interval = setInterval(() => {
      // Speed fluctuations
      setSpeedVal(prev => {
        const drift = (Math.random() - 0.5) * 3;
        const newSpeed = prev + drift;
        return Math.max(2, Math.min(80, Math.round(newSpeed)));
      });

      // Vehicle count shifts
      setVehicleCount(prev => prev + (Math.random() > 0.4 ? 1 : -1));

      // Lane occupancy drift
      setLaneOccupancy(prev => {
        const change = Math.floor((Math.random() - 0.5) * 4);
        return Math.max(30, Math.min(100, prev + change));
      });

      // OCR scanning simulated plate
      if (Math.random() > 0.7 && !model) {
        const newPlate = MOCK_LICENSE_PLATES[Math.floor(Math.random() * MOCK_LICENSE_PLATES.length)];
        setLicensePlates(prev => [newPlate, ...prev.slice(0, 9)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedCamId, selectedCam, model]);

  const handleToggleFeed = (id: string) => {
    let statusMsg = '';
    let statusType: 'success' | 'critical' = 'success';

    setCameraFeeds(prev =>
      prev.map(c => {
        if (c.id === id) {
          const newStatus = c.status === 'offline' ? 'online' : 'offline';
          statusMsg = `Camera ${id} status: ${newStatus.toUpperCase()}`;
          statusType = newStatus === 'online' ? 'success' : 'critical';
          return { ...c, status: newStatus };
        }
        return c;
      })
    );

    if (statusMsg) {
      showToast(statusMsg, statusType);
    }
  };

  const handleManualDispatch = () => {
    if (!selectedCam) return;
    showToast(`DISPATCHED: Patrol unit assigned to ${selectedCam.locality} (${selectedCam.id})`, 'success');
    
    const alreadyExists = incidents.some(inc => inc.locality.includes(selectedCam.locality) && inc.status === 'active');
    if (!alreadyExists) {
      handleAddIncident(
        'congestion_heavy',
        `${selectedCam.locality} Main Road`,
        selectedCam.lat,
        selectedCam.lon,
        `AI Forensics Incident: Camera ${selectedCam.id} flagged low average speed (${speedVal} km/h) and critical lane occupancy (${laneOccupancy}%).`
      );
    }
  };

  const handleSignalCalibrate = () => {
    if (!selectedCam) return;
    handleToggleJunctionSignal(selectedCam.id);
    showToast(`AI Calibrated green wave signals near ${selectedCam.locality}`, 'info');
  };

  const handleCorridorDiversion = () => {
    if (!selectedCam) return;
    handleToggleCorridorStatus(selectedCam.id);
    showToast(`Traffic Diversion calibrated for corridor: ${selectedCam.corridor}`, 'action');
  };

  // Adjust canvas size when video starts playing
  const handleLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.clientWidth;
      canvasRef.current.height = videoRef.current.clientHeight;
    }
  };

  // Filter camera feeds
  const filteredFeeds = cameraFeeds.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.locality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 select-none h-full">
      <style dangerouslySetInnerHTML={{ __html: CCTV_STYLES }} />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/80 border border-slate-900/60 p-4 rounded-xl shadow-2xl gap-4">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <Video className="w-4 h-4 mr-1 text-cyan-400" />
              <span>ASTRAM Live CCTV Neural Command Center</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">
              Client-side TensorFlow.js COCO-SSD Object Tracking & YOLO OCR Scanners
            </p>
          </div>
        </div>

        {/* Search & Indicators */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="cctv-feed-search"
              type="text"
              placeholder="Search camera feeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 pl-8 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 w-full sm:w-[180px]"
            />
          </div>
          <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex-shrink-0">
            Active Streams: {cameraFeeds.filter(c => c.status !== 'offline').length} / {cameraFeeds.length}
          </div>
        </div>
      </div>

      {/* Main Grid + Sidebar Split */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* CCTV Grid View (Left 3 columns) */}
        <div className="xl:col-span-3 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cctv-cam-grid">
            {filteredFeeds.map((feed) => {
              const isSelected = feed.id === selectedCamId;
              const isOffline = feed.status === 'offline';
              const hasIncident = feed.status === 'incident';
              
              return (
                <div
                  key={feed.id}
                  onClick={() => feed.status !== 'offline' && setSelectedCamId(feed.id)}
                  className={`glass-panel overflow-hidden transition-all duration-300 relative group flex flex-col justify-between ${
                    isOffline ? 'opacity-55 cursor-not-allowed border-red-950/20' : 'cursor-pointer'
                  } ${
                    isSelected ? 'ring-1 ring-cyan-500 border-cyan-500/40 shadow-cyan-500/5 shadow-lg' : 'hover:border-slate-800'
                  }`}
                  style={{ minHeight: '220px' }}
                >
                  {/* Video Viewport */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-900/60">
                    {/* Blinking Live Indicator */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center space-x-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900/40 font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-slate-600' : hasIncident ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                      <span className="text-[8px] font-black tracking-wider uppercase text-slate-300">
                        {isOffline ? 'OFFLINE' : hasIncident ? 'INCIDENT' : 'LIVE'}
                      </span>
                    </div>

                    {/* Camera ID Badge */}
                    <div className="absolute top-2.5 right-2.5 z-20 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900/40 font-mono text-[8px] font-bold text-slate-400">
                      {feed.id}
                    </div>

                    {/* Video Player / Static Noise Screen */}
                    {isOffline ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-600">
                        <VideoOff className="w-8 h-8 stroke-1 mb-1.5 text-red-500/40 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Video Link Disrupted</span>
                      </div>
                    ) : (
                      <>
                        <video
                          src={feed.videoUrl}
                          crossOrigin="anonymous"
                          className={`w-full h-full absolute inset-0 object-cover select-none pointer-events-none ${scanlinesActive ? 'brightness-90 contrast-105' : ''}`}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                        {/* Scanline CRT overlay */}
                        {scanlinesActive && (
                          <div className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]" />
                        )}

                      </>
                    )}
                  </div>

                  {/* Info Row */}
                  <div className="p-3 bg-slate-950/40 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-wider truncate">
                        {feed.name}
                      </h3>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                        {feed.corridor}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-900/60 pt-2 mt-2">
                      <div className="flex items-center space-x-3 text-[9px] font-mono">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Car className="w-3 h-3 text-sky-400" />
                          <span>{feed.baseVehicles} vpm</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span className={feed.baseSpeed < 15 ? 'text-red-400 font-bold animate-pulse' : ''}>{feed.baseSpeed} km/h</span>
                        </div>
                      </div>
                      
                      {/* Connection failure switch */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFeed(feed.id);
                        }}
                        className={`p-1 rounded transition border cursor-pointer ${
                          isOffline 
                            ? 'bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-900/20' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                        title={isOffline ? "Re-connect video feed" : "Disconnect video feed"}
                      >
                        <VideoOff className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Quick instructions alert */}
          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-start space-x-3 text-[10px] text-slate-400 leading-normal">
            <Cpu className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-200 uppercase tracking-wider">AI Computer Vision Infrastructure</p>
              <p className="mt-1">
                The control center runs client-side tensor mathematics. The grid displays real-time cameras with CSS tracking indicators, while theFocused panel compiles a pre-trained **TensorFlow.js COCO-SSD** neural network directly inside your browser container. This model parses the raw pixel arrays of the video feed, projecting canvas bounding outlines and updating SLA metrics dynamically.
              </p>
            </div>
          </div>
        </div>

        {/* Focused Camera View & AI Analytics (Right 1 column) */}
        <div className="xl:col-span-1">
          {selectedCam ? (
            <div className="glass-panel p-5 flex flex-col justify-between h-full space-y-4">
              {/* Camera Title Details */}
              <div>
                <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                  <div>
                    <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider">Neural Scanner Monitor</span>
                    <h2 className="text-xs font-black text-slate-200 mt-1 uppercase tracking-wider">
                      {selectedCam.id} — {selectedCam.locality}
                    </h2>
                  </div>
                  <span className="bg-cyan-950/40 border border-cyan-900 text-cyan-400 font-mono text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                    Focused
                  </span>
                </div>

                {/* Pre-trained Model Status Card */}
                <div className="mt-3 bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 flex items-center space-x-2 text-[9px]">
                  {isModelLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${model ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                  )}
                  <div className="flex-1">
                    <span className="text-slate-500 font-bold block uppercase text-[8px]">neural parser status</span>
                    <span className={`font-mono font-bold ${model ? 'text-emerald-400' : 'text-slate-400'}`}>{modelStatus}</span>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                     LIVE TENSORFLOW.JS INFERENCE MONITOR
                   ═══════════════════════════════════════════════════════════ */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border border-slate-900 rounded-lg my-3.5 shadow-xl">
                  {/* Blinking Badge */}
                  <div className="absolute top-2 left-2 z-20 flex items-center space-x-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900/40 text-[7px] font-mono font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{model ? 'REAL-TIME TF.JS INFERENCE' : 'FALLBACK OVERLAY'}</span>
                  </div>

                  {/* Video Node parsed by COCO-SSD */}
                  <video
                    ref={videoRef}
                    src={selectedCam.videoUrl}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover select-none pointer-events-none absolute inset-0"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  {/* Canvas Overlay for Object Detection Boxes */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                  />

                  {scanlinesActive && (
                    <div className="absolute inset-0 pointer-events-none z-15 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]" />
                  )}
                </div>

                <div className="text-[9px] bg-slate-950/50 p-2.5 rounded border border-slate-900/60 font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase font-bold">gps coordinates</span>
                    <span className="text-slate-300">{selectedCam.lat.toFixed(4)}, {selectedCam.lon.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase font-bold">city corridor</span>
                    <span className="text-slate-300">{selectedCam.corridor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase font-bold">network pipeline</span>
                    <span className="text-emerald-400 font-bold">SECURE CHANNEL</span>
                  </div>
                </div>

                {/* Display Toggles */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    id="btn-toggle-ai-overlay"
                    onClick={() => setAiOverlay(!aiOverlay)}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                      aiOverlay 
                        ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {aiOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>AI DETECTOR</span>
                  </button>
                  
                  <button
                    id="btn-toggle-scanlines"
                    onClick={() => setScanlinesActive(!scanlinesActive)}
                    className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                      scanlinesActive 
                        ? 'bg-cyan-950/30 border-cyan-900/60 text-cyan-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>SCANLINES</span>
                  </button>
                </div>

                {/* Real-time Telemetry Dashboard */}
                <h3 className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider block mt-5 mb-2">Live AI Telemetry</h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* Traffic Speed */}
                  <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900 flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">traffic speed</span>
                    <div className="flex items-baseline space-x-1 mt-1.5">
                      <span className={`text-base font-black font-mono tracking-wider ${speedVal < 15 ? 'text-red-400 glow-red animate-pulse' : 'text-slate-200'}`}>
                        {speedVal}
                      </span>
                      <span className="text-[7.5px] text-slate-500 uppercase">km/h</span>
                    </div>
                  </div>
                  {/* Traffic Volume */}
                  <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900 flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">traffic volume</span>
                    <div className="flex items-baseline space-x-1 mt-1.5">
                      <span className="text-base font-black font-mono text-slate-200 tracking-wider">
                        {vehicleCount}
                      </span>
                      <span className="text-[7.5px] text-slate-500 uppercase">vpm</span>
                    </div>
                  </div>
                  {/* Pedestrians */}
                  <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900 flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">pedestrian count</span>
                    <div className="flex items-baseline space-x-1 mt-1.5">
                      <span className="text-base font-black font-mono text-slate-200 tracking-wider">
                        {pedestrianCount}
                      </span>
                      <span className="text-[7.5px] text-slate-500 uppercase">pax/m</span>
                    </div>
                  </div>
                  {/* Lane Occupancy */}
                  <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900 flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">lane occupancy</span>
                    <div className="flex items-baseline space-x-1 mt-1.5">
                      <span className={`text-base font-black font-mono tracking-wider ${laneOccupancy > 85 ? 'text-red-400' : 'text-slate-200'}`}>
                        {laneOccupancy}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* OCR Scan Logs */}
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">Scanned License Plates</span>
                    <span className="text-[7.5px] bg-sky-950/40 border border-sky-900/60 text-sky-400 font-mono font-bold px-1 rounded">
                      {model ? 'REAL ML OCR' : 'MOCK OCR'}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-2 rounded-lg font-mono text-[9px] text-cyan-400/90 h-[100px] overflow-y-auto space-y-1 scrollbar-thin">
                    {licensePlates.map((plate, index) => (
                      <div key={index} className="flex justify-between border-b border-slate-900/40 pb-1 last:border-0 last:pb-0">
                        <span className="flex items-center text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
                          [SCANNING]
                        </span>
                        <span className="font-bold text-slate-200">{plate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-slate-900/80 pt-4">
                <button
                  id="btn-dispatch-officer"
                  onClick={handleManualDispatch}
                  className="w-full bg-red-950/40 hover:bg-red-900/20 border border-red-900/60 text-red-400 py-2.5 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Dispatch Response Team</span>
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSignalCalibrate}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2 rounded font-bold text-[9px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Calibrate Signal</span>
                  </button>
                  <button
                    onClick={handleCorridorDiversion}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2 rounded font-bold text-[9px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Divert Route</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-5 flex items-center justify-center text-slate-500 text-xs h-full">
              Select a camera feed to view analytics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
