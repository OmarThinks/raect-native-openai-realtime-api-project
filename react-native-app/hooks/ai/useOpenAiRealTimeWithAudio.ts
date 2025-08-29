import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { AudioBuffer, AudioContext } from "react-native-audio-api";
import { useAudioBufferQueue } from "../audio/useAudioBufferQueue";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";
import { requestRecordingPermissionsAsync } from "expo-audio";

const useOpenAiRealTimeWithAudio = () => {
  const { enqueueAudioBufferQueue, isAudioPlaying, stopPlayingAudio } =
    useAudioBufferQueue({ sampleRate: 24000 });

  const onSocketError = useCallback(() => {
    Alert.alert("Connection Error");
  }, []);

  const onAudioChunk = useCallback(
    async (audioText: string) => {
      const audioBuffer = await new AudioContext({
        sampleRate: 24000,
      }).decodePCMInBase64Data(audioText);

      enqueueAudioBufferQueue(audioBuffer);
    },
    [enqueueAudioBufferQueue]
  );

  const isWebSocketConnectedRef = useRef(false);
  const isAiResponseInProgressRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isAudioPlayingRef = useRef(false);

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
    onAudioChunk,
  });

  const onAudioReady = useCallback(
    (audioBuffer: AudioBuffer) => {
      // Conditions: isWebSocketConnected, !isAiResponseInProgress, isInitialized, !isAudioPlaying
      {
        if (
          isWebSocketConnectedRef.current &&
          !isAiResponseInProgressRef.current &&
          isInitializedRef.current &&
          !isAudioPlayingRef.current
        ) {
          const float32Array = audioBuffer.buffer.getChannelData(0);

          const uint8Array = new Uint8Array(float32Array.buffer);
          let binary = "";
          const chunkSize = 0x8000; // 32KB chunks to avoid call stack overflow
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
          }
          const base64AudioData = btoa(binary);
          sendBase64AudioStringChunk(base64AudioData);
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

  const connect = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();

      if (granted) {
        const tokenResponse = await fetch("http://localhost:3000/session");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;
        connectWebSocket({ ephemeralKey: EPHEMERAL_KEY });
      }
    } catch {}
  }, [connectWebSocket]);

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
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);
  useEffect(() => {
    isWebSocketConnectedRef.current = isWebSocketConnected;
  }, [isWebSocketConnected]);
  useEffect(() => {
    isAiResponseInProgressRef.current = isAiResponseInProgress;
  }, [isAiResponseInProgress]);
  useEffect(() => {
    isAudioPlayingRef.current = isAudioPlaying;
  }, [isAudioPlaying]);

  const isConnecting =
    isWebSocketConnecting || (isWebSocketConnected && !isInitialized);
  const isListening =
    isWebSocketConnected &&
    isInitialized &&
    isRecording &&
    !isAiResponseInProgress &&
    !isAudioPlaying;

  return {
    connect,
    disconnect: resetState,
    isConnected: isWebSocketConnected,
    isConnecting,
    isListening,
    isStreamingAudio: isRecording,
    isAiResponding: isAiResponseInProgress,
    transcription,
  };
};

export default useOpenAiRealTimeWithAudio;
