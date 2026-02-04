import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createExamFolder } from "@/utils/fileManager";

export default function NewExamScreen() {
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolYear, setSchoolYear] = useState("2023-2024");
  const [keyMode, setKeyMode] = useState<"scan" | "manual">("scan");

  const handleCreate = async () => {
    if (!section || !subject) return;

    try {
      await createExamFolder({
        schoolYear,
        section,
        subject,
        keyMode,
      });
      router.dismiss();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{ title: "New Exam Folder", presentation: "modal" }}
      />

      <ScrollView className="p-6">
        <Text className="text-2xl font-bold text-slate-800 mb-6">
          Setup Exam Folder
        </Text>

        <View className="mb-4">
          <Text className="text-slate-600 font-medium mb-2">School Year</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800"
            value={schoolYear}
            onChangeText={setSchoolYear}
            placeholder="e.g. 2023-2024"
          />
        </View>

        <View className="mb-4">
          <Text className="text-slate-600 font-medium mb-2">Section</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800"
            value={section}
            onChangeText={setSection}
            placeholder="e.g. Grade 10 - Rizal"
          />
        </View>

        <View className="mb-6">
          <Text className="text-slate-600 font-medium mb-2">Subject</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800"
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Mathematics"
          />
        </View>

        <View className="mb-8">
          <Text className="text-slate-600 font-medium mb-3">
            Answer Key Method
          </Text>
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => setKeyMode("scan")}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${keyMode === "scan" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <Text
                className={`font-semibold ${keyMode === "scan" ? "text-blue-700" : "text-slate-500"}`}>
                Scan Master Key
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setKeyMode("manual")}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${keyMode === "manual" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <Text
                className={`font-semibold ${keyMode === "manual" ? "text-blue-700" : "text-slate-500"}`}>
                Manual Input
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          className="w-full bg-blue-700 p-4 rounded-xl items-center shadow-md mb-4">
          <Text className="text-white font-bold text-lg">Create Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full p-4 items-center">
          <Text className="text-slate-500 font-medium">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
