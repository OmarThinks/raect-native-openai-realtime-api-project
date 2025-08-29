import { useCallback } from "react";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { AudioBuffer } from "react-native-audio-api";
import { useAudioBufferQueue } from "../audio/useAudioBufferQueue";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";

const useOpenAiRealTimeWithAudio = () => {
  const {
    enqueueAudioBufferQueue,
    isAudioPlaying,
    playAudio,
    stopPlayingAudio,
  } = useAudioBufferQueue({ sampleRate: 24000 });

  const onAudioReady = useCallback((audioBuffer: AudioBuffer) => {}, []);

  const { isRecording, startRecording, stopRecording } = useAudioStreamer({
    sampleRate: 16000,
    interval: 250,
    onAudioReady,
  });

  const onSocketClose = () => {
    stopPlayingAudio();
  };

  const {
    connectWebSocket,
    disconnectSocket,
    isAiResponseInProgress,
    isInitialized,
    isWebSocketConnected,
    isWebSocketConnecting,
    sendBase64AudioStringChunk,
    transcription,
  } = useOpenAiRealTime({
    instructions: "You are a helpful assistant.",
    onSocketClose,
  });

  const connect = useCallback(() => {}, []);
  const disconnect = useCallback(() => {}, []);
  const isConnected = false;
  const isAiResponding = false;
  const isConnecting = false;
  const isListening = false;

  return {
    connect,
    disconnect,
    isConnected,
    isAiResponding,
    isConnecting,
    isListening,
    isStreamingAudio: isRecording,
  };
};

export default useOpenAiRealTimeWithAudio;
