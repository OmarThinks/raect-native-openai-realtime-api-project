import { dummyBase64Audio16k } from "@/samples/dummyBase64Audio";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { AudioBuffer, AudioContext } from "react-native-audio-api";
import { useAudioBufferQueue } from "../audio/useAudioBufferQueue";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";

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

  const isAiResponseInProgressRef = useRef(false);
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
      {
        if (!isAiResponseInProgressRef.current && !isAudioPlayingRef.current) {
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

  console.log(
    "isConnected",
    isWebSocketConnected,
    isWebSocketConnecting,
    isInitialized,
    isRecording
  );

  const ping = useCallback(() => {
    sendBase64AudioStringChunk(dummyBase64Audio16k);
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
  };
};

export default useOpenAiRealTimeWithAudio;
