import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Clock, AlertTriangle, AlertCircle, MessageSquare } from "lucide-react-native";
import { ReportIncidentModal } from "./ReportIncidentModal";
import { IncidentsList } from "./IncidentsList";
import { useRouter } from "expo-router";

interface BusCardProps {
  id: string;
  line: string;
  origin: string;
  destination: string;
  time: string;
  has_passed?: boolean;
  routeNumber?: string; // Este será el num_ruta de la tabla routes
  incidents?: {
    count: number;
    types: ('delay' | 'full_bus' | 'incident' | 'other')[];
  };
  onReportSuccess?: () => void;
}

export function BusCard({ 
  id, 
  line, 
  origin, 
  destination, 
  time,
  routeNumber, // Nuevo parámetro
  incidents,
  has_passed = false, // Nuevo parámetro
  onReportSuccess = () => {} 
}: BusCardProps) {
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [incidentsListVisible, setIncidentsListVisible] = useState(false);
  const router = useRouter();

  // Renderiza los indicadores de incidencias si existen
  const renderIncidentsBadge = () => {
    if (!incidents || incidents.count === 0) return null;
    
    return (
      <TouchableOpacity 
        onPress={() => setIncidentsListVisible(true)}
        className="absolute top-2 right-2 bg-red-100 px-2 py-1 rounded-full flex-row items-center"
      >
        <AlertCircle size={12} color="#dc2626" />
        <Text className="text-red-600 text-xs ml-1 font-medium">{incidents.count}</Text>
      </TouchableOpacity>
    );
  };

  const handleReportSuccess = () => {
    onReportSuccess();
  };

  return (
    <View className={`bg-white p-4 rounded-lg mb-3 shadow-sm relative ${has_passed ? 'border-l-4 border-orange-400' : ''}`}>
      {/* Indicador visual para buses que ya pasaron */}
      {has_passed && (
        <View className="absolute top-2 left-2 bg-orange-100 px-2 py-1 rounded-full">
          <Text className="text-orange-600 text-xs font-medium">Bus pasado (15min)</Text>
        </View>
      )}
      
      {/* Indicador de incidencias */}
      {renderIncidentsBadge()}
      
      {/* Título con número de ruta */}
      <View className="flex-row items-center mb-4">
        {routeNumber ? (
          <View className="bg-blue-500 py-1 px-2 rounded-md">
            <Text className="text-white font-bold text-sm">
              {routeNumber}
            </Text>
          </View>
        ) : (
          <View className="bg-blue-100 py-1 px-2 rounded-lg">
            <Text className="text-blue-800 font-bold text-sm" numberOfLines={1} ellipsizeMode="tail">
              {line}
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row mb-4">
        <View className="mr-3 items-center">
          <View className="w-3 h-3 rounded-full bg-blue-500" />
          <View className="w-0.5 h-10 bg-gray-300 my-1" />
          <View className="w-3 h-3 rounded-full bg-red-500" />
        </View>
        
        <View className="flex-1 justify-between h-16">
          <View>
            <Text className="text-gray-800" numberOfLines={1} ellipsizeMode="tail">{origin}</Text>
          </View>
          <View>
            <Text className="text-gray-800" numberOfLines={1} ellipsizeMode="tail">{destination}</Text>
          </View>
        </View>
      </View>
      
      <View className="flex-row items-center">
        <Clock size={16} color="#666" />
        <Text className="ml-1 font-medium">{time}</Text>
      </View>
      
      {/* Mensaje adicional cuando el bus ya ha pasado */}
      {has_passed && (
        <View className="mt-2 bg-orange-50 rounded-lg p-2 flex-row items-center border border-orange-100">
          <Clock size={16} color="#f97316" />
          <Text className="ml-2 text-orange-700 text-sm">
            Aquest bus ja ha passat. Encara pots reportar incidències durant 15 minuts.
          </Text>
        </View>
      )}
      
      {/* Botones para acciones */}
      <View className="mt-3 flex-row border-t border-gray-100 pt-2">
        {/* Botón para reportar incidencias */}
        <TouchableOpacity 
          onPress={() => setReportModalVisible(true)}
          className="flex-1 flex-row items-center justify-center py-2"
        >
          <AlertTriangle size={14} color="#6b7280" />
          <Text className="ml-1 text-gray-500 text-sm">Reportar</Text>
        </TouchableOpacity>
        
        {/* Separador vertical */}
        <View className="h-full w-px bg-gray-100" />
        
        {/* Botón para ver incidencias */}
        <TouchableOpacity 
          onPress={() => setIncidentsListVisible(true)}
          className="flex-1 flex-row items-center justify-center py-2"
        >
          <MessageSquare size={14} color="#6b7280" />
          <Text className="ml-1 text-gray-500 text-sm">
            {incidents && incidents.count > 0 ? `Ver ${incidents.count}` : "Ver incidències"}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Botón destacado para ver incidencias cuando hay incidencias reportadas */}
      {incidents && incidents.count > 0 && (
        <TouchableOpacity
          onPress={() => setIncidentsListVisible(true)}
          className="mt-2 bg-red-50 rounded-lg p-2 flex-row items-center border border-red-100"
        >
          <AlertCircle size={18} color="#dc2626" />
          <View className="flex-1 ml-2">
            <Text className="text-red-800 font-medium">
              {incidents.count} {incidents.count === 1 ? 'incidència' : 'incidències'} reportades
            </Text>
            <Text className="text-red-600 text-xs mt-0.5">
              Toca per veure les incidències d'aquesta ruta
            </Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Modal para reportar incidencias */}
      <ReportIncidentModal 
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        tripId={id}
        routeName={routeNumber || line}
        onReportSuccess={handleReportSuccess}
      />
      
      {/* Modal para ver lista de incidencias */}
      <IncidentsList
        visible={incidentsListVisible}
        onClose={() => setIncidentsListVisible(false)}
        tripId={id}
        routeName={routeNumber || line}
      />
    </View>
  );
}