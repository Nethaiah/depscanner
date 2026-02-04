import { saveCapturedImage } from "@/utils/fileManager";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScannerScreen() {
  const { folderId } = useLocalSearchParams();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"on" | "off">("off");

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-center text-lg mb-4 text-slate-800">
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-6 py-3 rounded-lg">
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri && typeof folderId === "string") {
          await saveCapturedImage(folderId, photo.uri);
          Alert.alert("Captured!", "Image saved to exam folder.");
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        ref={cameraRef}>
        <SafeAreaView className="flex-1 justify-between">
          {/* Header Controls */}
          <View className="flex-row justify-between px-4 pt-4 z-30">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-black/40 rounded-full">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <View className="bg-black/40 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                Auto-Focus: On
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleFlash}
              className="w-10 h-10 items-center justify-center bg-black/40 rounded-full">
              <Ionicons
                name={flash === "on" ? "flash" : "flash-off"}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Guide Box Overlay */}
          <View className="absolute inset-0 items-center justify-center z-20 pointer-events-none">
            {/* Darkened borders handled by a mask would be better, but user requested simpler layout first. 
                         The user sample code used specific overlays. Let's try to mimic the "hole" effect visually 
                         or just use the box border as requested.
                     */}

            {/* The Guide Box */}
            <View className="w-[85%] h-[70%] border-2 border-yellow-400 rounded-lg relative">
              {/* Corner Indicators */}
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-[2px] -ml-[2px]" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-[2px] -mr-[2px]" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-[2px] -ml-[2px]" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-[2px] -mr-[2px]" />

              <View className="bg-black/60 px-4 py-2 rounded self-center mt-auto mb-4">
                <Text className="text-white text-center font-bold">
                  Align 4 squares within the corners
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Controls */}
          <View className="flex-row justify-center items-center pb-8 z-30">
            <TouchableOpacity
              onPress={takePicture}
              className="w-20 h-20 bg-white rounded-full border-4 border-blue-600 shadow-lg items-center justify-center">
              <View className="w-16 h-16 bg-white rounded-full border-2 border-slate-200" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
