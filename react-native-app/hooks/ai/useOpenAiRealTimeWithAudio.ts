import { useCallback } from "react";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { AudioBuffer } from "react-native-audio-api";
import { useAudioBufferQueue } from "../audio/useAudioBufferQueue";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";
import { AudioContext } from "react-native-audio-api";
import { Alert } from "react-native";

const useOpenAiRealTimeWithAudio = () => {
  const {
    enqueueAudioBufferQueue,
    isAudioPlaying,
    playAudio,
    stopPlayingAudio,
  } = useAudioBufferQueue({ sampleRate: 24000 });

  const onSocketClose = useCallback(() => {
    stopPlayingAudio();
  }, [stopPlayingAudio]);

  const onAudioChunk = useCallback(
    async (audioText: string) => {
      const audioBuffer = await new AudioContext({
        sampleRate: 24000,
      }).decodePCMInBase64Data(audioText);

      enqueueAudioBufferQueue(audioBuffer);
    },
    [enqueueAudioBufferQueue]
  );

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
    onAudioChunk,
  });

  const onAudioReady = useCallback((audioBuffer: AudioBuffer) => {
    const audioContext = new AudioContext();
    //audioBuffer.buffer.sendBase64AudioStringChunk();
  }, []);

  const { isRecording, startRecording, stopRecording } = useAudioStreamer({
    sampleRate: 16000,
    interval: 250,
    onAudioReady,
  });

  const resetState = useCallback(() => {
    disconnectSocket();
    stopRecording();
    stopPlayingAudio();
  }, [disconnectSocket, stopPlayingAudio, stopRecording]);

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
