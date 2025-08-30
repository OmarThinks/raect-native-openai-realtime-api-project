import useOpenAiRealTimeWithAudio from "@/hooks/ai/useOpenAiRealTimeWithAudio";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { useCallback } from "react";
import { Alert, Button, Text, View } from "react-native";

// TODO: Replace with your internal ip address
const localIpAddress = "http://192.168.8.103";

function HomeScreen() {
  return null;

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
    isAudioPlaying,
    interrupt,
  } = useOpenAiRealTimeWithAudio();

  const logTranscription = useCallback(() => {
    console.log(transcription);
  }, [transcription]);

  const _connect = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      console.log("granted", granted);

      if (granted) {
        console.log("getting backend response");
        const tokenResponse = await fetch(`${localIpAddress}:3000/session`);
        console.log("tokenResponse", tokenResponse);
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;
        console.log("token", EPHEMERAL_KEY);
        connect({ ephemeralToken: EPHEMERAL_KEY });
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

      <Text style={{ fontSize: 16 }}>Is Listening: {`${isListening}`}</Text>

      <Text style={{ fontSize: 16 }}>
        Is Microphone Active: {`${isStreamingAudio}`}
      </Text>

      <Text style={{ fontSize: 16 }}>
        isAiResponding: {`${isAiResponding}`}
      </Text>
      <Text style={{ fontSize: 16 }}>
        isAudioPlaying: {`${isAudioPlaying}`}
      </Text>

      <Text style={{ fontSize: 16 }}> Transcription: {transcription}</Text>

      {isListening && <Button title="Ping" onPress={ping} />}

      <Button title="Log Transcription" onPress={logTranscription} />
      {isAudioPlaying && <Button title="Interrupt" onPress={interrupt} />}
    </View>
  );
}

export default HomeScreen;
