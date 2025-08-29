import { useCallback } from "react";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { AudioBuffer } from "react-native-audio-api";

const useOpenAiRealTimeWithAudio = () => {
  const onAudioReady = useCallback((audioBuffer: AudioBuffer) => {}, []);

  const { isRecording, startRecording, stopRecording } = useAudioStreamer({
    sampleRate: 16000,
    interval: 250,
    onAudioReady,
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
