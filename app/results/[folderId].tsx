import {
  getImagesForFolder,
  getResults,
  saveResults,
} from "@/utils/fileManager";
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
  ActivityIndicator,
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

// Defined in fileManager but duplicated here for local usage/updates
interface ScanResult {
  id: string;
  studentName: string;
  score: number;
  total: number;
  status: "success" | "review";
}

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48) / 3; // 3 columns with padding

export default function ResultsScreen() {
  const { folderId } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"results" | "images">("results");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (typeof folderId === "string") {
        loadData(folderId);
      }
    }, [folderId]),
  );

  const loadData = async (id: string) => {
    const [imgs, res] = await Promise.all([
      getImagesForFolder(id),
      getResults(id),
    ]);
    setImages(imgs);
    setResults(res as ScanResult[]);
  };

  const handleScan = () => {
    // Navigate to camera for rapid fire
    router.push({
      pathname: "/scan/[folderId]",
      params: { folderId: folderId as string },
    });
  };

  const processImage = async (imageUri: string) => {
    // MOCK PROCESSING LOGIC
    // In real app, this sends image to backend
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    const filename = imageUri.split("/").pop() || "";
    const isLowScore = Math.random() > 0.7;

    return {
      id: imageUri, // Link result to image path
      studentName: "Student " + Math.floor(Math.random() * 900 + 100),
      score: isLowScore
        ? Math.floor(Math.random() * 20)
        : Math.floor(Math.random() * 20 + 30),
      total: 50,
      status: isLowScore ? "review" : "success",
    } as ScanResult;
  };

  const handleBatchProcess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Filter images that are NOT yet in results
      const scannedIds = new Set(results.map((r) => r.id));
      const pendingImages = images.filter((img) => !scannedIds.has(img));

      if (pendingImages.length === 0) {
        Alert.alert("All caught up", "No new images to scan.");
        setIsProcessing(false);
        return;
      }

      const newResults = [...results];
      let processedCount = 0;

      for (const img of pendingImages) {
        const result = await processImage(img);
        newResults.unshift(result); // Add to top
        processedCount++;
      }

      setResults(newResults);
      if (typeof folderId === "string") {
        await saveResults(folderId, newResults);
      }

      Alert.alert("Batch Complete", `Processed ${processedCount} papers.`);
      setActiveTab("results"); // Switch to results to show them
    } catch (e) {
      Alert.alert("Error", "Batch processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleProcess = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      const result = await processImage(imageUri);
      const newResults = [result, ...results.filter((r) => r.id !== imageUri)];
      setResults(newResults);
      if (typeof folderId === "string") {
        await saveResults(folderId, newResults);
      }
      setSelectedImage(null); // Close modal
      Alert.alert("Scanned", `Score: ${result.score}/${result.total}`);
    } catch (e) {
      Alert.alert("Error", "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      if (results.length === 0) {
        Alert.alert("No Data", "Scan some papers first.");
        return;
      }

      const csvContent =
        "Student Name,Score,Total,Status,ImageID\n" +
        results
          .map(
            (r) =>
              `${r.studentName},${r.score},${r.total},${r.status},${r.id.split("/").pop()}`,
          )
          .join("\n");

      const fileUri =
        ((FileSystem as any).documentDirectory || "") +
        `results_${folderId}.csv`;
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
      ListEmptyComponent={
        <View className="items-center justify-center py-20">
          <Text className="text-slate-400">No results yet.</Text>
          <TouchableOpacity
            onPress={() => setActiveTab("images")}
            className="mt-4">
            <Text className="text-blue-600 font-bold">Go to Images</Text>
          </TouchableOpacity>
        </View>
      }
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

  const renderImages = () => {
    const scannedIds = new Set(results.map((r) => r.id));
    const pendingCount = images.filter((img) => !scannedIds.has(img)).length;

    return (
      <View className="flex-1">
        {pendingCount > 0 && (
          <View className="p-4 border-b border-slate-100 bg-blue-50 flex-row justify-between items-center">
            <Text className="text-blue-800 font-medium">
              {pendingCount} pending scans
            </Text>
            <TouchableOpacity
              onPress={handleBatchProcess}
              disabled={isProcessing}
              className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center gap-2">
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="scan" size={16} color="white" />
              )}
              <Text className="text-white font-bold text-xs uppercase">
                Process All
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
          renderItem={({ item }) => {
            const isScanned = scannedIds.has(item);
            return (
              <TouchableOpacity
                onPress={() => setSelectedImage(item)}
                className="relative">
                <Image
                  source={{ uri: item }}
                  style={{ width: IMAGE_SIZE, height: IMAGE_SIZE * 1.3 }}
                  className={`rounded-md bg-slate-200 ${isScanned ? "opacity-50" : "opacity-100"}`}
                  resizeMode="cover"
                />
                {isScanned && (
                  <View className="absolute inset-0 items-center justify-center bg-black/10 rounded-md">
                    <View className="bg-green-500 rounded-full p-1">
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

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
          <Text className="text-2xl font-bold text-green-600">
            {results.filter((r) => r.score >= r.total * 0.75).length}
          </Text>
          <Text className="text-xs text-slate-500 uppercase">High</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-red-600">
            {results.filter((r) => r.score < r.total * 0.75).length}
          </Text>
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
          className="flex-1 bg-blue-700 p-4 rounded-xl items-center shadow-lg flex-row gap-2 justify-center">
          <Ionicons name="camera" size={20} color="white" />
          <Text className="font-bold text-white">Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/95 justify-center items-center relative">
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute top-12 right-6 z-10 p-2 bg-white/10 rounded-full">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <>
              <Image
                source={{ uri: selectedImage }}
                style={{ width: width, height: "70%" }}
                resizeMode="contain"
              />

              {/* Single Scan Action */}
              {!results.find((r) => r.id === selectedImage) ? (
                <TouchableOpacity
                  onPress={() => handleSingleProcess(selectedImage)}
                  disabled={isProcessing}
                  className="absolute bottom-20 bg-blue-600 px-8 py-4 rounded-full flex-row items-center gap-3 shadow-xl">
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Ionicons name="scan-circle" size={24} color="white" />
                  )}
                  <Text className="text-white font-bold text-lg">
                    Scan this Paper
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="absolute bottom-20 bg-green-600 px-6 py-3 rounded-full flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold">Already Scanned</Text>
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
