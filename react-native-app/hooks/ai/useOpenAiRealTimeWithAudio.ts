import { useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { AudioBuffer, AudioContext } from "react-native-audio-api";
import { useAudioBufferQueue } from "../audio/useAudioBufferQueue";
import { useAudioStreamer } from "../audio/useAudioStreamer";
import { useOpenAiRealTime } from "./useOpenAiRealTimeHook";
import { requestRecordingPermissionsAsync } from "expo-audio";

const useOpenAiRealTimeWithAudio = () => {
  const {
    enqueueAudioBufferQueue,
    isAudioPlaying,
    playAudio,
    stopPlayingAudio,
  } = useAudioBufferQueue({ sampleRate: 24000 });

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

  const connect = useCallback(
    async ({ ephemiralToken }: { ephemiralToken: string }) => {
      try {
        const { granted } = await requestRecordingPermissionsAsync();

        if (granted) {
          const tokenResponse = await fetch("http://localhost:3000/session");
          const data = await tokenResponse.json();
          const EPHEMERAL_KEY = data.client_secret.value;
          connectWebSocket({ ephemeralKey: EPHEMERAL_KEY });
        }
      } catch {}
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
  };
};

export default useOpenAiRealTimeWithAudio;
