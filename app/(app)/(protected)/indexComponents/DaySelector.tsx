import React from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";

interface DaySelectorProps {
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export function DaySelector({ days, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="px-4 py-3"
    >
      {days.map((day) => (
        <TouchableOpacity
          key={day}
          onPress={() => onSelectDay(day)}
          className={`mr-2 rounded-full px-4 py-2 ${
            selectedDay === day ? 'bg-blue-500' : 'bg-white border border-gray-200'
          }`}
        >
          <Text className={selectedDay === day ? 'text-white' : 'text-gray-700'}>
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}