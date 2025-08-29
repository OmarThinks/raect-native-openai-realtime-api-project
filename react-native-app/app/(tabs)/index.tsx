import useOpenAiRealTimeWithAudio from "@/hooks/ai/useOpenAiRealTimeWithAudio";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { useCallback } from "react";
import { Alert, Button, Text, View } from "react-native";

function HomeScreen() {
  const {
    connect,
    disconnect,
    isAiResponding,
    isConnected,
    isConnecting,
    isListening,
    isStreamingAudio,
    transcription,
    ping,
  } = useOpenAiRealTimeWithAudio();

  const _connect = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        const tokenResponse = await fetch("http://localhost:3000/session");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;
        connect(EPHEMERAL_KEY);
      } else {
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Something went wrong.");
    }
  }, [connect]);

  return (
    <View className="flex-1 items-stretch justify-center bg-white p-4">
      {isConnecting ? (
        <Text>Connecting...</Text>
      ) : (
        <Button
          title={isConnected ? "Disconnect" : "Connect"}
          onPress={isConnected ? disconnect : _connect}
        />
      )}

      <Text>Is Listening: {`${isListening}`}</Text>

      <Text>Is Microphone Active: {`${isStreamingAudio}`}</Text>

      <Text> Transcription: {transcription}</Text>

      {isListening && <Button title="Ping" onPress={ping} />}
    </View>
  );
}

export default HomeScreen;
