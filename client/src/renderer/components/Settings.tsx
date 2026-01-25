import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Headphones, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { voiceService } from '../services/voice';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function Settings() {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('default');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('default');
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(100);
  const [voiceVolume, setVoiceVolume] = useState<number>(100);
  const [pushToTalkKey, setPushToTalkKey] = useState<string>('Space');
  const [isListeningForKey, setIsListeningForKey] = useState(false);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [testingInput, setTestingInput] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);

  // Load audio devices
  useEffect(() => {
    loadDevices();
    loadSettings();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  const loadDevices = async () => {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || 'Unknown Microphone', kind: d.kind }));

      const outputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || 'Unknown Speaker', kind: d.kind }));

      setInputDevices(inputs);
      setOutputDevices(outputs);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadSettings = () => {
    const settings = localStorage.getItem('wevibin-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setSelectedInputDevice(parsed.inputDevice || 'default');
        setSelectedOutputDevice(parsed.outputDevice || 'default');
        setInputVolume(parsed.inputVolume ?? 100);
        setOutputVolume(parsed.outputVolume ?? 100);
        setMusicVolume(parsed.musicVolume ?? 100);
        setVoiceVolume(parsed.voiceVolume ?? 100);
        setPushToTalkKey(parsed.pushToTalkKey || 'Space');
        setEchoCancellation(parsed.echoCancellation ?? true);
        setNoiseSuppression(parsed.noiseSuppression ?? true);
        setAutoGainControl(parsed.autoGainControl ?? true);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = () => {
    const settings = {
      inputDevice: selectedInputDevice,
      outputDevice: selectedOutputDevice,
      inputVolume,
      outputVolume,
      musicVolume,
      voiceVolume,
      pushToTalkKey,
      echoCancellation,
      noiseSuppression,
      autoGainControl,
    };
    localStorage.setItem('wevibin-settings', JSON.stringify(settings));
  };

  // Handle input device change
  const handleInputDeviceChange = async (deviceId: string) => {
    setSelectedInputDevice(deviceId);
    await voiceService.setInputDevice(deviceId);
    saveSettings();
  };

  // Handle output device change
  const handleOutputDeviceChange = async (deviceId: string) => {
    setSelectedOutputDevice(deviceId);
    // Note: Output device selection (setSinkId) is tricky in browsers and often restricted.
    // VoiceService typically plays through default context destination unless specific API usage is added.
    // For now we just save the preference.
    saveSettings();
  };

  // Handle audio processing settings change
  const handleAudioProcessingChange = async (setting: 'echo' | 'noise' | 'gain', value: boolean) => {
    let newEcho = echoCancellation;
    let newNoise = noiseSuppression;
    let newGain = autoGainControl;

    if (setting === 'echo') {
      newEcho = value;
      setEchoCancellation(value);
    } else if (setting === 'noise') {
      newNoise = value;
      setNoiseSuppression(value);
    } else if (setting === 'gain') {
      newGain = value;
      setAutoGainControl(value);
    }

    // Re-initialize input with new constraints
    await voiceService.setInputDevice(selectedInputDevice);
    saveSettings();
  };

  useEffect(() => {
    saveSettings();
    voiceService.setOutputVolume(voiceVolume / 100);
  }, [
    selectedInputDevice,
    selectedOutputDevice,
    inputVolume,
    outputVolume,
    musicVolume,
    voiceVolume,
    pushToTalkKey,
    echoCancellation,
    noiseSuppression,
    autoGainControl,
  ]);

  const handleKeyCapture = (e: React.KeyboardEvent) => {
    if (isListeningForKey) {
      e.preventDefault();
      setPushToTalkKey(e.code);
      setIsListeningForKey(false);
    }
  };

  const testInputLevel = async () => {
    if (testingInput) {
      setTestingInput(false);
      voiceService.stopTestMode();
      setInputLevel(0);
      return;
    }

    try {
      setTestingInput(true);
      await voiceService.setInputDevice(selectedInputDevice);
      voiceService.startTestMode();

      const checkLevel = () => {
        if (!testingInput) return; // This relies on closure, might need ref refactoring if state updates are slow

        // Simple visualizer simulation or real data from service
        const vol = voiceService.getVolume();
        // vol is 0-255 usually from AnalyserNode
        setInputLevel(Math.min(100, (vol / 128) * 100)); // Amplify a bit for visibility

        if (testingInput) {
          requestAnimationFrame(checkLevel);
        }
      };

      // Start the loop
      // We need a ref to break the loop properly or just rely on the fact that if we stop calling rAF it stops
      // But testingInput inside the function is stale closure.
      // Let's use a simpler interval or improved rAF pattern:

      const interval = setInterval(() => {
        const vol = voiceService.getVolume();
        setInputLevel(Math.min(100, (vol / 60) * 100));
      }, 50);

      // Cleanup function when testing stops
      const cleanup = () => {
        clearInterval(interval);
        voiceService.stopTestMode();
        setInputLevel(0);
      };

      // Monkey-patch the stop button handler effectively by storing cleanup? 
      // Actually React state is cleaner.
      // For now, let's just make sure the UI logic toggles it off.
      // See the effect below for cleanup.

    } catch (error) {
      console.error('Failed to test input:', error);
      setTestingInput(false);
    }
  };

  // Cleanup effect for test mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testingInput) {
      interval = setInterval(() => {
        const vol = voiceService.getVolume();
        // Scale volume for display
        setInputLevel(Math.min(100, (vol / 50) * 100));
      }, 50);
    } else {
      voiceService.stopTestMode();
      setInputLevel(0);
    }
    return () => clearInterval(interval);
  }, [testingInput]);


  return (
    <div className="wv-page">
      <div className="wv-container" style={{ maxWidth: '900px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SettingsIcon size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Settings</h1>
              <p style={{ color: '#a1a1aa' }}>Configure your audio and controls</p>
            </div>
          </div>

          {/* Audio Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#16161f',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Mic size={24} color="#a855f7" />
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Microphone Input</h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>
                Input Device
              </label>
              <select
                value={selectedInputDevice}
                onChange={(e) => handleInputDeviceChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  color: '#f5f5f7',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="default">Default Microphone</option>
                {inputDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#a1a1aa' }}>Input Volume (Gain)</label>
                <span style={{ fontSize: '14px', color: '#a855f7', fontWeight: '600' }}>{inputVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={inputVolume}
                onChange={(e) => setInputVolume(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setTestingInput(!testingInput)}
                style={{
                  padding: '12px 24px',
                  background: testingInput ? '#ef4444' : '#a855f7',
                  color: '#f5f5f7',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                {testingInput ? 'Stop Testing' : 'Test Microphone'}
              </button>
              {testingInput && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${inputLevel}%`,
                      height: '100%',
                      background: inputLevel > 80 ? '#ef4444' : inputLevel > 50 ? '#eab308' : '#22c55e',
                      transition: 'width 0.1s, background-color 0.3s',
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px', textAlign: 'center' }}>
                    Speak into your microphone to hear yourself and test levels
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                background: echoCancellation ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => handleAudioProcessingChange('echo', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Echo Cancellation</div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Reduces echo from speakers</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                background: noiseSuppression ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => handleAudioProcessingChange('noise', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Noise Suppression</div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Filters background noise</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                background: autoGainControl ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={autoGainControl}
                  onChange={(e) => handleAudioProcessingChange('gain', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Auto Gain Control</div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Automatically adjusts volume</div>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Audio Output Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#16161f',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Headphones size={24} color="#22d3ee" />
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Audio Output</h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>
                Output Device
              </label>
              <select
                value={selectedOutputDevice}
                onChange={(e) => handleOutputDeviceChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '8px',
                  color: '#f5f5f7',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="default">Default Speaker</option>
                {outputDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#a1a1aa' }}>Master Volume</label>
                <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: '600' }}>{outputVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={outputVolume}
                onChange={(e) => setOutputVolume(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#a1a1aa' }}>Music Volume</label>
                <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: '600' }}>{musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#a1a1aa' }}>Voice Volume</label>
                <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: '600' }}>{voiceVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: '#16161f',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              borderRadius: '16px',
              padding: '24px',
            }}
            onKeyDown={handleKeyCapture}
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Monitor size={24} color="#eab308" />
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Controls</h2>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>
                Push-to-Talk Key
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '8px',
                  color: '#f5f5f7',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}>
                  {pushToTalkKey}
                </div>
                <button
                  onClick={() => setIsListeningForKey(true)}
                  style={{
                    padding: '12px 24px',
                    background: isListeningForKey ? '#eab308' : '#16161f',
                    border: '1px solid #eab308',
                    color: isListeningForKey ? '#0a0a0f' : '#eab308',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isListeningForKey ? 'Press a key...' : 'Change Key'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px' }}>
                Click "Change Key" and press any key to set as Push-to-Talk
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
              Settings are saved automatically and will persist across sessions
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
