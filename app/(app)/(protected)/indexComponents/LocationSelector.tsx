import React from "react";
import { Modal, View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Search, X } from "lucide-react-native";

interface LocationSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  title: string;
  locations: string[];
}

export function LocationSelector({ visible, onClose, onSelect, title, locations }: LocationSelectorProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={24} color="#111" />
            </TouchableOpacity>
          </View>
          
          <View className="bg-gray-100 flex-row items-center px-3 py-2 rounded-lg mb-3">
            <Search size={18} color="#6B7280" />
            <Text className="ml-2 text-gray-400">Cerca ubicació...</Text>
          </View>
          
          <ScrollView className="max-h-96">
            {locations.map(location => (
              <TouchableOpacity
                key={location}
                onPress={() => onSelect(location)}
                className="py-3 border-b border-gray-100"
              >
                <Text className="text-gray-800">{location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}