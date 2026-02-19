import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Code, Box, Terminal, Activity, Layers, Globe, GripVertical, Settings } from 'lucide-react';
import { BlocklyEditor } from './components/BlocklyEditor';
import { PythonEditor } from './components/PythonEditor';
import { Simulator } from './components/Simulator';
import { ThreeSimulator } from './components/ThreeSimulator';
import { TelemetryCharts } from './components/TelemetryCharts';
import { useDroneStore } from './store';
import { useDroneController } from './hooks/useDroneController';
import { usePhysicsEngine } from './hooks/usePhysicsEngine';

function App() {
  const [mode, setMode] = useState<'blocks' | 'python'>('blocks');
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'charts'>('3d');
  const [pythonCode, setPythonCode] = useState<string>('tello.takeoff()\ntello.move_forward(100)\ntello.rotate_clockwise(90)\ntello.move_forward(100)\ntello.land()');
  const [blocklyCode, setBlocklyCode] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const isDraggingRef = useRef(false);

  const logs = useDroneStore((state) => state.logs);
  const resetDrone = useDroneStore((state) => state.resetDrone);
  const trailSettings = useDroneStore((state) => state.drone.trailSettings);
  const environmentSettings = useDroneStore((state) => state.drone.environmentSettings);
  const updateTrailSettings = useDroneStore((state) => state.updateTrailSettings);
  const updateEnvironmentSettings = useDroneStore((state) => state.updateEnvironmentSettings);
  
  const telloController = useDroneController();
  
  // Enable physics engine
  usePhysicsEngine();

  const isRunningRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const width = (e.clientX / window.innerWidth) * 100;
      setLeftPanelWidth(Math.min(80, Math.max(20, width)));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const handleRun = async () => {
    // Stop any previous run
    isRunningRef.current = false;
    // Wait a bit for previous loop to exit if it checks the ref
    await new Promise(r => setTimeout(r, 100));
    
    isRunningRef.current = true;
    resetDrone();
    
    // Small delay to ensure reset happens before execution
    await new Promise(r => setTimeout(r, 100));

    // Wrap tello controller to check isRunningRef
    const safeTello = new Proxy(telloController, {
      get(target, prop) {
        const value = target[prop as keyof typeof telloController];
        if (typeof value === 'function') {
          return async (...args: any[]) => {
            if (!isRunningRef.current) throw new Error('Mission Aborted');
            return value.apply(this, args);
          };
        }
        return value;
      }
    });

    try {
      if (mode === 'blocks') {
        // Execute generated JS code
        const runCode = new Function('tello', `return (async () => { ${blocklyCode} })();`);
        await runCode(safeTello);
      } else {
        // Parse Python-ish code
        const lines = pythonCode.split('\n');
        for (const line of lines) {
          if (!isRunningRef.current) break;
          
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          // Map python commands to controller methods
          if (trimmed.includes('takeoff()')) await safeTello.takeoff();
          else if (trimmed.includes('land()')) await safeTello.land();
          else if (trimmed.includes('move_forward')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.forward(parseInt(match[1]));
          }
          else if (trimmed.includes('move_back')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.back(parseInt(match[1]));
          }
          else if (trimmed.includes('move_left')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.left(parseInt(match[1]));
          }
          else if (trimmed.includes('move_right')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.right(parseInt(match[1]));
          }
          else if (trimmed.includes('move_up')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.up(parseInt(match[1]));
          }
          else if (trimmed.includes('move_down')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.down(parseInt(match[1]));
          }
          else if (trimmed.includes('rotate_clockwise')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.rotate('cw', parseInt(match[1]));
          }
          else if (trimmed.includes('rotate_counter_clockwise')) {
            const match = trimmed.match(/\((\d+)\)/);
            if (match) await safeTello.rotate('ccw', parseInt(match[1]));
          }
          else if (trimmed.includes('flip')) {
             const match = trimmed.match(/\(['"](\w+)['"]\)/);
             if (match) await safeTello.flip(match[1]);
          }
        }
      }
    } catch (e: any) {
      if (e?.message !== 'Mission Aborted') {
        console.error(e);
        useDroneStore.getState().addLog(`Error: ${e}`);
      } else {
        useDroneStore.getState().addLog('Mission Aborted.');
      }
    } finally {
      isRunningRef.current = false;
    }
  };

  const handleStop = () => {
    isRunningRef.current = false;
  };

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Box className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">TelloSim Pro</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('blocks')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'blocks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Box className="w-4 h-4" />
              Blocks
            </button>
            <button
              onClick={() => setMode('python')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'python' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code className="w-4 h-4" />
              Python
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={resetDrone}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset Simulator"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleStop}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Stop
          </button>

          <button
            onClick={handleRun}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm active:transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Mission
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col border-r border-slate-200 bg-white relative">
          <div className="flex-1 relative">
            {mode === 'blocks' ? (
              <BlocklyEditor 
                onCodeChange={setBlocklyCode} 
                onPythonCodeChange={setPythonCode}
                initialPythonCode={pythonCode}
              />
            ) : (
              <PythonEditor code={pythonCode} onChange={(val) => setPythonCode(val || '')} />
            )}
          </div>
          
          {/* Console / Logs */}
          <div className="h-48 border-t border-slate-200 bg-slate-900 text-slate-200 flex flex-col">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Terminal className="w-3 h-3" />
              Mission Log
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
              {logs.length === 0 && <span className="text-slate-600 italic">Ready to fly...</span>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-blue-400 opacity-50">{log.split(']')[0]}]</span>
                  <span>{log.split(']')[1]}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Drag Handle */}
        <div 
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center transition-colors z-20"
            onMouseDown={handleMouseDown}
        >
            <div className="h-8 w-1 bg-slate-400 rounded-full" />
        </div>

        {/* Simulator Panel */}
        <div style={{ width: `${100 - leftPanelWidth}%` }} className="bg-slate-50 relative flex flex-col">
            {/* View Tabs */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="flex bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button
                      onClick={() => setViewMode('2d')}
                      className={`p-2 rounded-md transition-all ${viewMode === '2d' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="2D View"
                  >
                      <Layers className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setViewMode('3d')}
                      className={`p-2 rounded-md transition-all ${viewMode === '3d' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="3D View"
                  >
                      <Globe className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setViewMode('charts')}
                      className={`p-2 rounded-md transition-all ${viewMode === 'charts' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Telemetry"
                  >
                      <Activity className="w-5 h-5" />
                  </button>
              </div>

              {viewMode === '3d' && (
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-lg border border-slate-200 shadow-sm transition-all ${showSettings ? 'bg-blue-600 text-white' : 'bg-white/90 backdrop-blur text-slate-500 hover:text-slate-700'}`}
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {showSettings && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-20 max-h-[80vh] overflow-y-auto">
                      
                      {/* Environment Settings */}
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                           <Globe className="w-4 h-4" /> Environment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 block mb-1">Scenario</label>
                                <select 
                                    value={environmentSettings.preset}
                                    onChange={(e) => updateEnvironmentSettings({ preset: e.target.value as any })}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                >
                                    <option value="city">City</option>
                                    <option value="park">Park</option>
                                    <option value="studio">Studio</option>
                                    <option value="sunset">Sunset</option>
                                    <option value="night">Night</option>
                                    <option value="forest">Forest</option>
                                    <option value="apartment">Apartment</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-slate-600">Show Grid</label>
                                <input 
                                    type="checkbox" 
                                    checked={environmentSettings.showGrid}
                                    onChange={(e) => updateEnvironmentSettings({ showGrid: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-600 block mb-1">Background Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#0f172a', '#000000', '#ffffff', '#87CEEB', '#1a1a1a'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateEnvironmentSettings({ backgroundColor: c })}
                                        className={`w-6 h-6 rounded-full border ${environmentSettings.backgroundColor === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                    ))}
                                </div>
                            </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200 my-4" />

                      {/* Trail Settings */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Trail
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-slate-600">Show Trail</label>
                              <input 
                                type="checkbox" 
                                checked={trailSettings.show}
                                onChange={(e) => updateTrailSettings({ show: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-slate-600 block mb-1">Color</label>
                              <div className="flex gap-2 flex-wrap">
                                {['#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ffffff'].map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateTrailSettings({ color: c })}
                                    className={`w-6 h-6 rounded-full border ${trailSettings.color === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-slate-300'}`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm text-slate-600 block mb-1">Width: {trailSettings.width}px</label>
                              <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={trailSettings.width}
                                onChange={(e) => updateTrailSettings({ width: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
                {viewMode === '2d' && <Simulator />}
                {viewMode === '3d' && <ThreeSimulator />}
                {viewMode === 'charts' && <TelemetryCharts />}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
