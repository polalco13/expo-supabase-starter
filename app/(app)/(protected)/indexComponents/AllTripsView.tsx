import React from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { BusCard } from "./BusCard";
import { AllTripsResult } from "../../../../services/api";
import { X, Info } from "lucide-react-native";

interface AllTripsViewProps {
  trips: AllTripsResult[];
  loading: boolean;
  selectedDay: string;
  origin: string;
  destination: string;
  onClose: () => void;
}

export function AllTripsView({ 
  trips, 
  loading, 
  selectedDay, 
  origin, 
  destination, 
  onClose 
}: AllTripsViewProps) {
  // Obtener viajes específicos para la ruta seleccionada
  const matchingTrips = trips.filter(trip => {
    // Comprobar si el origen contiene el texto del origen seleccionado o viceversa
    const originMatch = 
      trip.origin_name.includes(origin) || 
      origin.includes(trip.origin_name) ||
      trip.origin_name.toLowerCase().includes(origin.toLowerCase()) ||
      origin.toLowerCase().includes(trip.origin_name.toLowerCase());
    
    // Comprobar si el destino contiene el texto del destino seleccionado o viceversa
    const destMatch = 
      trip.destination_name.includes(destination) || 
      destination.includes(trip.destination_name) ||
      trip.destination_name.toLowerCase().includes(destination.toLowerCase()) ||
      destination.toLowerCase().includes(trip.destination_name.toLowerCase());
    
    return originMatch && destMatch;
  });
  
  // Usar los viajes coincidentes si existen, si no, usar todos los válidos
  const validTrips = matchingTrips.length > 0 
    ? matchingTrips
    : trips.filter(trip => 
        trip.route_name && 
        trip.origin_name && 
        trip.destination_name && 
        trip.departure_time
      );

  return (
    <View className="bg-white rounded-t-3xl absolute bottom-0 left-0 right-0 max-h-[90%]">
      {/* Cabecera con título y botón de cierre */}
      <View className="bg-blue-500 p-4 rounded-t-3xl border-b border-blue-600">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-white">Horaris {selectedDay}</Text>
          <TouchableOpacity 
            onPress={onClose}
            className="bg-blue-400 p-2 rounded-full"
          >
            <X size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Información de datos */}
      <View className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex-row items-center">
        <Info size={16} color="#3B82F6" />
        <Text className="ml-2 text-sm text-blue-800">
          {matchingTrips.length > 0 
            ? `${matchingTrips.length} horaris per a ${origin} → ${destination}`
            : `No s'han trobat horaris exactes per a aquesta ruta`
          }
        </Text>
      </View>
      
      {/* Lista de viajes */}
      <ScrollView className="p-4">
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-3 text-gray-600">Carregant busos...</Text>
          </View>
        ) : validTrips.length > 0 ? (
          <>
            <Text className="text-gray-500 mb-4">{validTrips.length} viajes encontrados</Text>
            {validTrips.map(trip => (
              <BusCard
                key={trip.trip_id}
                line={trip.route_name || "Sin nombre"}
                origin={trip.origin_name || "Origen desconocido"}
                destination={trip.destination_name || "Destino desconocido"}
                time={trip.departure_time || "--:--"}
                status={trip.status === 'delayed' ? `Retrasado ${trip.delay_minutes} min` : 'A tiempo'}
                occupancy={trip.occupancy_level as 'low' | 'medium' | 'high'}
              />
            ))}
          </>
        ) : (
          <View className="py-10 items-center">
            <Text className="text-gray-600 text-center">No hi ha busos disponibles per a aquesta ruta.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}