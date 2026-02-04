import { MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface FolderCardProps {
  title: string;
  section: string;
  date: string;
  onPress: () => void;
}

export function FolderCard({ title, section, date, onPress }: FolderCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 flex-row items-center justify-between">
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <MaterialIcons
            name="folder"
            size={20}
            color="#1d4ed8"
            className="mr-2"
          />
          <Text className="text-lg font-bold text-slate-900">{section}</Text>
        </View>
        <Text className="text-slate-600 text-sm mb-1">{title}</Text>
        <Text className="text-slate-400 text-xs">{date}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  );
}
