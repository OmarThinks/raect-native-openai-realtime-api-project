import { View, Text } from "react-native";
import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { dummyBase64Audio24K } from "@/samples/dummyBase64Audio";
import {
  combineBase64ArrayList,
  useOpenAiRealTime,
} from "@/hooks/ai/useOpenAiRealTimeHook";

const New = () => {
  const [messages, setMessages] = useState<object[]>([]);
  const isAudioPlayingRef = useRef(false);

  const onIsAudioPlayingUpdate = useCallback((playing: boolean) => {
    isAudioPlayingRef.current = playing;
  }, []);

  const { isAudioPlaying, playAudio, stopPlayingAudio } = useAudioPlayer({
    onIsAudioPlayingUpdate,
  });

  const enqueueMessage = useCallback((message: object) => {
    console.log("Got response chunk");
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const onAudioResponseComplete = useCallback(
    (base64String: string) => {
      console.log("Playing full response");
      playAudio({
        sampleRate: 24000,
        base64Text: base64String,
      });
    },
    [playAudio]
  );

  const onUsageReport = useCallback((usage: object) => {
    console.log("Usage report:", usage);
  }, []);

  const onSocketClose = useCallback(() => {
    console.log("onSocketClose");
    //stopStreaming();
    stopPlayingAudio();
  }, [stopPlayingAudio]);

  const onReadyToReceiveAudio = useCallback(() => {
    //startStreaming();
  }, []);

  const {
    isWebSocketConnected,
    connectWebSocket,
    disconnectSocket,
    isWebSocketConnecting,
    sendBase64AudioStringChunk,
    isAiResponseInProgress,
    isInitialized,
    transcription,
  } = useOpenAiRealTime({
    instructions: "You are a helpful assistant.",
    onMessageReceived: enqueueMessage,
    onAudioResponseComplete,
    onUsageReport,
    onSocketClose,
    onReadyToReceiveAudio,
  });

  const ping = useCallback(() => {
    sendBase64AudioStringChunk(dummyBase64Audio24K);
  }, [sendBase64AudioStringChunk]);

  const [chunks, setChunks] = useState<string[]>([]);

  console.log("before onAudioStreamerChunk: ", isAiResponseInProgress);

  const onAudioStreamerChunk = useCallback(
    (chunk: string) => {
      setChunks((prev) => [...prev, chunk]);
      if (
        isWebSocketConnected &&
        isInitialized &&
        !isAiResponseInProgress &&
        !isAudioPlayingRef.current
      ) {
        console.log("Sending audio chunk:", chunk.slice(0, 50) + "..."); // base64 string
        sendBase64AudioStringChunk(chunk);
      }
    },
    [
      isAiResponseInProgress,
      isInitialized,
      isWebSocketConnected,
      sendBase64AudioStringChunk,
    ]
  );

  const { isStreaming, startStreaming, stopStreaming } = useAudioStreamer({
    sampleRate: 16000, // e.g., 16kHz - // TODO : The documentation doesn't specify the exact requirements for this. It tried 16K and 24K. I think 16k is better.
    interval: 250, // emit every 250 milliseconds
    onAudioChunk: onAudioStreamerChunk,
  });

  const playAudioRecorderChunks = useCallback(() => {
    const combined = combineBase64ArrayList(chunks);
    playAudio({ base64Text: combined, sampleRate: 16000 });
  }, [chunks, playAudio]);

  const _connectWebSocket = useCallback(async () => {
    const tokenResponse = await fetch("http://localhost:3000/session");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    connectWebSocket({ ephemeralKey: EPHEMERAL_KEY });
  }, [connectWebSocket]);

  useEffect(() => {
    if (isWebSocketConnected) {
      if (isInitialized) {
        console.log("Starting audio streaming");
        startStreaming();
      }
    } else {
      console.log("Stopping audio streaming");
      stopStreaming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebSocketConnected, isInitialized]);

  return (
    <View>
      <Text>New</Text>
    </View>
  );
};

export default New;
