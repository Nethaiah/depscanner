import { FolderCard } from "@/components/FolderCard";
import { ExamMetadata, getExams } from "@/utils/fileManager";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [folders, setFolders] = useState<ExamMetadata[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, []),
  );

  const loadFolders = async () => {
    const data = await getExams();
    setFolders(data);
  };

  const handleCreateFolder = () => {
    router.push("/exam/new");
  };

  const handleOpenFolder = (id: string) => {
    router.push({ pathname: "/results/[folderId]", params: { folderId: id } });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
            Workspace
          </Text>
          <Text className="text-2xl font-bold text-slate-900">
            Maayos Grader
          </Text>
        </View>
        <TouchableOpacity className="bg-slate-200 p-2 rounded-full">
          <Ionicons name="settings-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-5 pb-24"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="documents-outline" size={64} color="#bdc3c7" />
            <Text className="text-slate-400 mt-4 text-center">
              No exams yet.{"\n"}Tap + to start.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <FolderCard
            section={item.section}
            title={item.subject}
            date={new Date(item.createdAt).toLocaleDateString()}
            onPress={() => handleOpenFolder(item.id)}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreateFolder}
        className="absolute bottom-8 right-6 bg-blue-700 w-14 h-14 rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
