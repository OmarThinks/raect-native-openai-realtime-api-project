import { dummyBase64Audio24K } from "@/samples/dummyBase64Audio";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { AudioBuffer } from "react-native-audio-api";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { useBase64PcmAudioPlayer } from "../audio/useBase64PcmAudioPlayer";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";

const useOpenAiRealTimeWithAudio = () => {
  const {
    isAudioPlaying,
    playPcmBase64Audio,
    stopPlayingAudio,
    isAudioPlayingSafe,
  } = useBase64PcmAudioPlayer({ sampleRate: 24000, coolingDuration: 500 });

  const onSocketError = useCallback(() => {
    Alert.alert("Connection Error");
  }, []);

  const onAudioResponseComplete = useCallback(
    (base64Audio: string) => {
      playPcmBase64Audio({ base64String: base64Audio });
    },
    [playPcmBase64Audio]
  );

  const isAiResponseInProgressRef = useRef(false);
  const isAudioPlayingSafeRef = useRef(false);

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
    onSocketError,
    onAudioResponseComplete,
  });

  const onAudioReady = useCallback(
    (audioBuffer: AudioBuffer) => {
      {
        if (
          !isAiResponseInProgressRef.current &&
          !isAudioPlayingSafeRef.current
        ) {
          sendBase64AudioStringChunk(convertAudioBufferToBase64(audioBuffer));
        }
      }
    },
    [sendBase64AudioStringChunk]
  );

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

  const connect = useCallback(
    async ({ ephemeralToken }: { ephemeralToken: string }) => {
      connectWebSocket({ ephemeralKey: ephemeralToken });
    },
    [connectWebSocket]
  );

  useEffect(() => {
    if (isWebSocketConnected) {
      startRecording();
    }
    if (!isWebSocketConnected) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebSocketConnected]);

  useEffect(() => {
    isAiResponseInProgressRef.current = isAiResponseInProgress;
  }, [isAiResponseInProgress]);
  useEffect(() => {
    isAudioPlayingSafeRef.current = isAudioPlayingSafe;
  }, [isAudioPlayingSafe]);

  const isConnecting =
    isWebSocketConnecting || (isWebSocketConnected && !isInitialized);
  const isListening =
    isWebSocketConnected &&
    isInitialized &&
    isRecording &&
    !isAiResponseInProgress &&
    !isAudioPlayingSafe;

  console.log(
    "isConnected",
    isWebSocketConnected,
    isWebSocketConnecting,
    isInitialized,
    isRecording
  );

  const ping = useCallback(() => {
    sendBase64AudioStringChunk(dummyBase64Audio24K);
  }, [sendBase64AudioStringChunk]);

  return {
    connect,
    disconnect: resetState,
    isConnected: isWebSocketConnected,
    isConnecting,
    isListening,
    isStreamingAudio: isRecording,
    isAiResponding: isAiResponseInProgress,
    transcription,
    ping,
    isAudioPlaying,
    interrupt: stopPlayingAudio,
  };
};

const convertAudioBufferToBase64 = (audioBuffer: AudioBuffer) => {
  const float32Array = audioBuffer.getChannelData(0);

  // Convert Float32Array to 16-bit PCM
  const pcmData = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    pcmData[i] = Math.round(sample * 32767);
  }

  // Convert to bytes
  const bytes = new Uint8Array(pcmData.buffer);

  // Convert to base64
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  const base64String = btoa(binary);

  return base64String;
};

export default useOpenAiRealTimeWithAudio;
export { convertAudioBufferToBase64 };
