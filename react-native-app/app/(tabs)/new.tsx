import {
  combineBase64ArrayList,
  useOpenAiRealTime,
} from "@/hooks/ai/useOpenAiRealTimeHook";
import { useAudioPlayer } from "@/hooks/audio/useAudioPlayer";
import { useAudioStreamer } from "@/hooks/audio/useAudioStreamer";
import { dummyBase64Audio24K } from "@/samples/dummyBase64Audio";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";
import { AudioBuffer } from "react-native-audio-api";
import { SafeAreaView } from "react-native-safe-area-context";

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
    (audioBuffer: AudioBuffer) => {
      const chunk = convertAudioBufferToBase64(audioBuffer);
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
    onAudioReady: onAudioStreamerChunk,
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
    <SafeAreaView className=" self-stretch flex-1">
      <View className=" self-stretch flex-1">
        <View
          className=" self-stretch flex-1"
          style={{
            backgroundColor: "black",
            gap: 16,
            display: "flex",
            flexDirection: "column",
            padding: 16,
          }}
        >
          <View>
            <Button
              onPress={() => {
                playAudio({
                  base64Text: dummyBase64Audio24K,
                  sampleRate: 24000,
                });
              }}
              title="Play 24K string"
            />
          </View>
          <View>
            {isWebSocketConnected && <Button onPress={ping} title="Ping" />}
            {isWebSocketConnecting ? (
              <Text>Connecting...</Text>
            ) : isWebSocketConnected ? (
              <Button onPress={disconnectSocket} title="disconnectSocket" />
            ) : (
              <Button onPress={_connectWebSocket} title="connectWebSocket" />
            )}

            <Button
              onPress={() => {
                console.log("Log Messages:", messages);
              }}
              title="Log Messages"
            />
          </View>
          <HR />

          <View>
            <Text className=" text-[30px] font-bold">Transcription:</Text>
            <Text>{transcription}</Text>
          </View>

          <HR />

          <View className=" flex-row flex items-center">
            <Text>Is audio Playing: {isAudioPlaying ? "Yes" : "No"}</Text>

            {isAudioPlaying && (
              <Button onPress={stopPlayingAudio} title="Stop Playing" />
            )}
          </View>

          <HR />

          <View className=" flex flex-row items-center gap-2">
            {!isStreaming && (
              <Button onPress={startStreaming} title="Start Streaming" />
            )}
            {isStreaming && (
              <Button onPress={stopStreaming} title="Stop Streaming" />
            )}
            {isStreaming && (
              <Button onPress={playAudioRecorderChunks} title="Play Stream" />
            )}
          </View>
          <Text>Is Streaming: {isStreaming ? "Yes" : "No"}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const HR = memo(function HR_() {
  return <View className=" self-stretch bg-white h-[2px] " />;
});

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

export default New;
