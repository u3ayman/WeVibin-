import { socketService } from './socket';

export class VoiceService {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private input: MediaStream | null = null;

  // Playback state
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private gainNode: GainNode | null = null;

  // Settings
  private sampleRate = 24000; // Lower sample rate for bandwidth
  private bufferSize = 2048; // Balance latency/performance

  // Analysis
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  // State
  private isTestMode: boolean = false;
  private isPttActive: boolean = false;

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    socketService.on(
      'voice-data',
      (data: { userId: string; audio: Int16Array }) => {
        // Don't play own audio unless in test mode (which is handled locally)
        if (data.userId === socketService.id) return;
        this.playAudioChunk(data.audio);
      },
    );
  }

  async initialize(): Promise<boolean> {
    try {
      this.audioContext =
        new // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.sampleRate,
        });

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      return true;
    } catch (e) {
      console.error('Failed to init audio context', e);
      return false;
    }
  }

  async setInputDevice(deviceId: string) {
    if (this.input) {
      this.input.getTracks().forEach((t) => t.stop());
    }

    // Disconnect old nodes if they exist
    if (this.source) {
      this.source.disconnect();
    }
    if (this.processor) {
      this.processor.disconnect();
    }

    try {
      if (!this.audioContext) await this.initialize();
      if (!this.audioContext) return false;

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.input = await navigator.mediaDevices.getUserMedia(constraints);
      this.source = this.audioContext.createMediaStreamSource(this.input);
      this.analyser = this.audioContext.createAnalyser();
      this.source.connect(this.analyser);

      // Use ScriptProcessor for capturing raw PCM
      // 4096 buffer size = ~170ms at 24kHz.
      // 2048 buffer size = ~85ms at 24kHz.
      this.processor = this.audioContext.createScriptProcessor(
        this.bufferSize,
        1,
        1,
      );

      this.processor.onaudioprocess = (e) => {
        if (!this.isPttActive && !this.isTestMode) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send to server
        if (this.isPttActive) {
          socketService.emit('voice-data', { audio: pcmData });
        }

        // Local loopback for test mode
        if (this.isTestMode) {
          this.playAudioChunk(pcmData, true);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination); // Required for script processor to run, but we can mute it

      // Mute the processor output so we don't hear ourselves directly through the graph
      // (Test mode plays back via playAudioChunk)
      // Actually scriptProcessor outputs silence usually if we don't copy input to output

      return true;
    } catch (e) {
      console.error('Error setting input device:', e);
      return false;
    }
  }

  startPtt() {
    this.isPttActive = true;
    this.resumeContext();
  }

  stopPtt() {
    this.isPttActive = false;
  }

  startTestMode() {
    this.isTestMode = true;
    this.resumeContext();
  }

  stopTestMode() {
    this.isTestMode = false;
  }

  private resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private playAudioChunk(
    int16Data: Int16Array | ArrayBuffer,
    isLocalTest = false,
  ) {
    if (!this.audioContext) return;

    // Ensure we handle ArrayBuffers if they come from the network that way
    const data =
      int16Data instanceof Int16Array ? int16Data : new Int16Array(int16Data);

    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const int = data[i];
      float32Data[i] = int < 0 ? int / 0x8000 : int / 0x7fff;
    }

    const buffer = this.audioContext.createBuffer(
      1,
      float32Data.length,
      this.sampleRate,
    );
    buffer.copyToChannel(float32Data, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    if (isLocalTest && this.gainNode) {
      // Play directly
      source.connect(this.gainNode);
    } else if (this.gainNode) {
      // Schedule
      const currentTime = this.audioContext.currentTime;
      // Add a small delay for jitter (50ms)
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.05;
      }

      source.connect(this.gainNode);
      source.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;
      return;
    }

    source.start();
  }

  getVolume(): number {
    if (!this.analyser || !this.dataArray) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.dataArray.length;
  }

  setOutputVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }
}

export const voiceService = new VoiceService();
