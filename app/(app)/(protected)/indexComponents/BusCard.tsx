import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Clock } from "lucide-react-native";

interface BusCardProps {
  line: string;
  origin: string;
  destination: string;
  time: string;
  status: string;
  occupancy: 'low' | 'medium' | 'high' | 'full' | 'empty' | 'unknown';
}

export function BusCard({ line, origin, destination, time, status, occupancy }: BusCardProps) {
  // Función para renderizar el estado de ocupación
  const renderOccupancy = () => {
    let icon, text;
    
    switch(occupancy) {
      case 'empty':
      case 'low':
        icon = "👍";
        text = "Seients disponibles";
        break;
      case 'medium':
        icon = "👌";
        text = "Va omplint-se";
        break;
      case 'high':
      case 'full':
        icon = "👀";
        text = "Acostuma a anar ple";
        break;
      default:
        icon = "❓";
        text = "Ocupació desconeguda";
    }
    
    return (
      <View className="flex-row items-center">
        <Text className="mr-1 text-base">{icon}</Text>
        <Text className="text-gray-700 text-sm">{text}</Text>
      </View>
    );
  };

  return (
    <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <View className="bg-blue-100 py-1 px-3 rounded-full">
          <Text className="text-blue-800 font-bold">{line}</Text>
        </View>
        <Text 
          className={status.includes('Retrasado') ? 'text-orange-500' : 'text-green-600'}
        >
          {status}
        </Text>
      </View>
      
      <View className="flex-row mb-4">
        <View className="mr-3 items-center">
          <View className="w-3 h-3 rounded-full bg-blue-500" />
          <View className="w-0.5 h-10 bg-gray-300 my-1" />
          <View className="w-3 h-3 rounded-full bg-red-500" />
        </View>
        
        <View className="flex-1 justify-between h-16">
          <View>
            <Text className="text-gray-800">{origin}</Text>
          </View>
          <View>
            <Text className="text-gray-800">{destination}</Text>
          </View>
        </View>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Clock size={16} color="#666" />
          <Text className="ml-1 font-medium">{time}</Text>
        </View>
        {renderOccupancy()}
      </View>
    </View>
  );
}