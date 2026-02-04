import { getImagesForFolder } from "@/utils/fileManager";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock results for now
interface ScanResult {
  id: string;
  studentName: string;
  score: number;
  total: number;
  status: "success" | "review";
}

const MOCK_RESULTS: ScanResult[] = [
  {
    id: "1",
    studentName: "Juan Dela Cruz",
    score: 35,
    total: 50,
    status: "success",
  },
  {
    id: "2",
    studentName: "Maria Clara",
    score: 48,
    total: 50,
    status: "success",
  },
  {
    id: "3",
    studentName: "Crisostomo Ibarra",
    score: 12,
    total: 50,
    status: "review",
  },
];

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48) / 3; // 3 columns with padding

export default function ResultsScreen() {
  const { folderId } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"results" | "images">("results");
  const [results, setResults] = useState<ScanResult[]>(MOCK_RESULTS);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (typeof folderId === "string") {
        loadImages(folderId);
      }
    }, [folderId]),
  );

  const loadImages = async (id: string) => {
    const imgs = await getImagesForFolder(id);
    setImages(imgs);
  };

  const handleScan = () => {
    router.push({
      pathname: "/scan/[folderId]",
      params: { folderId: folderId as string },
    });
  };

  const handleExport = async () => {
    try {
      const csvContent =
        "Student Name,Score,Total,Status\n" +
        results
          .map((r) => `${r.studentName},${r.score},${r.total},${r.status}`)
          .join("\n");

      const fileUri =
        ((FileSystem as any).documentDirectory || "") + "results.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export CSV");
    }
  };

  const renderResults = () => (
    <FlatList
      key="results-list"
      data={results}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4"
      renderItem={({ item }) => (
        <TouchableOpacity className="flex-row items-center bg-white p-4 rounded-lg shadow-sm mb-2 border-l-4 border-slate-200">
          <View className="flex-1">
            <Text className="font-semibold text-slate-800 text-lg">
              {item.studentName}
            </Text>
            <Text className="text-slate-500">
              Status: {item.status === "success" ? "OK" : "Check Manually"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xl font-bold text-blue-700">
              {item.score}/{item.total}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const renderImages = () => (
    <FlatList
      key="images-grid"
      data={images}
      keyExtractor={(item) => item}
      numColumns={3}
      contentContainerClassName="p-4 gap-2"
      columnWrapperClassName="gap-2"
      ListEmptyComponent={
        <View className="items-center py-10">
          <Text className="text-slate-400">No images scanned yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setSelectedImage(item)}>
          <Image
            source={{ uri: item }}
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE * 1.3 }}
            className="rounded-md bg-slate-200"
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ title: "Results", headerBackTitle: "Home" }} />

      {/* Header Stats */}
      <View className="flex-row p-4 bg-white border-b border-slate-200 justify-around">
        <View className="items-center">
          <Text className="text-2xl font-bold text-slate-800">
            {images.length}
          </Text>
          <Text className="text-xs text-slate-500 uppercase">Scanned</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-green-600">48</Text>
          <Text className="text-xs text-slate-500 uppercase">High</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-red-600">12</Text>
          <Text className="text-xs text-slate-500 uppercase">Low</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View className="flex-row p-4 pb-0">
        <TouchableOpacity
          onPress={() => setActiveTab("results")}
          className={`flex-1 pb-3 border-b-2 items-center ${activeTab === "results" ? "border-blue-600" : "border-transparent"}`}>
          <Text
            className={`font-semibold ${activeTab === "results" ? "text-blue-700" : "text-slate-400"}`}>
            Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("images")}
          className={`flex-1 pb-3 border-b-2 items-center ${activeTab === "images" ? "border-blue-600" : "border-transparent"}`}>
          <Text
            className={`font-semibold ${activeTab === "images" ? "text-blue-700" : "text-slate-400"}`}>
            Images
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1">
        {activeTab === "results" ? renderResults() : renderImages()}
      </View>

      {/* Footer Actions */}
      <View className="p-4 flex-row gap-4 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleExport}
          className="flex-1 bg-white border-2 border-slate-300 p-4 rounded-xl items-center">
          <Text className="font-bold text-slate-600">Export CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleScan}
          className="flex-1 bg-blue-700 p-4 rounded-xl items-center shadow-lg">
          <Text className="font-bold text-white">Scan Papers</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center relative">
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute top-12 right-6 z-10 p-2">
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: width, height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
