'use client';
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronDown } from "lucide-react-native";

interface SearchBarProps {
  origin: string;
  destination: string;
  onOriginPress: () => void;
  onDestinationPress: () => void;
  onSwap: () => void;
  onSearch: () => void;
}

export function SearchBar({
  origin,
  destination,
  onOriginPress,
  onDestinationPress,
  onSwap,
  onSearch
}: SearchBarProps) {
  return (
    <View className="bg-white rounded-xl p-4 shadow">
      {/* Origen */}
      <TouchableOpacity onPress={onOriginPress} className="mb-3">
        <Text className="text-gray-500 text-xs mb-1">Origen</Text>
        <View className="flex-row justify-between items-center border-b border-gray-200 py-2">
          <Text className="text-gray-800 font-medium">{origin}</Text>
          <ChevronDown size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>

      {/* Botón para intercambiar */}
      <TouchableOpacity
        onPress={onSwap}
        className="bg-gray-100 p-2 rounded-full self-center my-1"
      >
        <ArrowUpDown size={18} color="#4B5563" />
      </TouchableOpacity>

      {/* Destino */}
      <TouchableOpacity onPress={onDestinationPress} className="mb-4">
        <Text className="text-gray-500 text-xs mb-1">Destí</Text>
        <View className="flex-row justify-between items-center border-b border-gray-200 py-2">
          <Text className="text-gray-800 font-medium">{destination}</Text>
          <ChevronDown size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>

      {/* Botón de búsqueda */}
      <Button className="bg-blue-500 py-3 rounded-lg" onPress={onSearch}>
        <Text className="text-white font-bold">Buscar</Text>
      </Button>
    </View>
  );
}

export default SearchBar;
