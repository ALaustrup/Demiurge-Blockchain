/**
 * Voice Module Exports
 * 
 * Provides voice chat capabilities for:
 * - Sophia AI Voice Mode (Grok Voice API)
 * - User-to-User WebRTC Voice Chat
 */

// Types
export * from './types';

// Audio utilities
export {
  AudioCaptureManager,
  getAudioCapture,
  resetAudioCapture,
  type AudioCaptureConfig,
  type AudioCaptureState,
  type AudioCaptureEvents,
} from './audio-capture';

export {
  AudioPlaybackManager,
  getAudioPlayback,
  resetAudioPlayback,
  type AudioPlaybackConfig,
  type AudioPlaybackState,
  type AudioPlaybackEvents,
} from './audio-playback';

// Sophia Voice Client
export {
  SophiaVoiceClient,
  getSophiaVoice,
  resetSophiaVoice,
  type SophiaVoiceEvents,
} from './sophia-voice-client';

// WebRTC Client
export {
  WebRTCClient,
  createWebRTCClient,
  type WebRTCClientConfig,
  type WebRTCClientEvents,
} from './webrtc-client';
