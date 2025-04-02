import React, { useState, useEffect } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { BusCard } from "./BusCard";
import { AllTripsResult } from "../../../../services/api";
import { X, ArrowRight, Search, Filter, Info } from "lucide-react-native";

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
  const [searchText, setSearchText] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  
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
  
  // Obtener todas las localizaciones únicas de origen y destino (solo de datos válidos)
  const allOrigins = Array.from(new Set(validTrips
    .map(trip => trip.origin_name)
    .filter(name => name && name.trim() !== "")
  )).sort();
  
  const allDestinations = Array.from(new Set(validTrips
    .map(trip => trip.destination_name)
    .filter(name => name && name.trim() !== "")
  )).sort();
  
  // Función para filtrar viajes según los criterios seleccionados
  const getFilteredTrips = () => {
    return validTrips.filter(trip => {
      // Filtrar por origen y destino seleccionados
      const originMatch = !selectedOrigin || trip.origin_name === selectedOrigin;
      const destMatch = !selectedDestination || trip.destination_name === selectedDestination;
      
      // Filtrar por texto de búsqueda
      const searchMatch = !searchText || 
        trip.route_name.toLowerCase().includes(searchText.toLowerCase()) ||
        trip.origin_name.toLowerCase().includes(searchText.toLowerCase()) ||
        trip.destination_name.toLowerCase().includes(searchText.toLowerCase()) ||
        trip.departure_time.toLowerCase().includes(searchText.toLowerCase());
      
      return originMatch && destMatch && searchMatch;
    });
  };
  
  const filteredTrips = getFilteredTrips();
  
  // Resetear los filtros a los valores iniciales
  const resetFilters = () => {
    setSelectedOrigin("");
    setSelectedDestination("");
    setSearchText("");
  };
  
  // Al iniciar, establecer los valores predeterminados según la ruta seleccionada
  useEffect(() => {
    // Encontrar el origen que mejor coincide con el origen seleccionado
    const bestOriginMatch = allOrigins.find(org => 
      org.includes(origin) || origin.includes(org) ||
      org.toLowerCase().includes(origin.toLowerCase()) || 
      origin.toLowerCase().includes(org.toLowerCase())
    );
    
    // Encontrar el destino que mejor coincide con el destino seleccionado
    const bestDestinationMatch = allDestinations.find(dest => 
      dest.includes(destination) || destination.includes(dest) ||
      dest.toLowerCase().includes(destination.toLowerCase()) || 
      destination.toLowerCase().includes(dest.toLowerCase())
    );
    
    // Establecer los valores iniciales según las mejores coincidencias
    if (bestOriginMatch) setSelectedOrigin(bestOriginMatch);
    if (bestDestinationMatch) setSelectedDestination(bestDestinationMatch);
    
    // Si no hay coincidencias, mantener los filtros vacíos
  }, [allOrigins, allDestinations, origin, destination]);
  
  // Para mostrar un resumen de los datos disponibles
  useEffect(() => {
    console.log(`AllTripsView recibió ${trips.length} viajes`);
    console.log(`Viajes válidos (con todos los datos): ${validTrips.length}/${trips.length}`);
    console.log(`Viajes que coinciden con la ruta seleccionada ${origin} → ${destination}: ${matchingTrips.length}`);
    
    if (matchingTrips.length > 0) {
      console.log(`Primer viaje para la ruta seleccionada: ${matchingTrips[0].origin_name} → ${matchingTrips[0].destination_name} (${matchingTrips[0].departure_time})`);
    } else if (validTrips.length > 0) {
      console.log(`No hay viajes exactos para la ruta seleccionada. Mostrando todas las rutas válidas.`);
      console.log(`Primer viaje válido: ${validTrips[0].origin_name} → ${validTrips[0].destination_name} (${validTrips[0].departure_time})`);
    }
  }, [trips, origin, destination]);

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
      <View className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex-row items-center">
        <Info size={16} color="#3B82F6" />
        <Text className="ml-2 text-sm text-blue-800">
          {matchingTrips.length > 0 
            ? `${matchingTrips.length} horaris per a ${origin} → ${destination}`
            : `No s'han trobat horaris exactes per a aquesta ruta`
          }
        </Text>
      </View>
      
      {/* Barra de búsqueda */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mr-2">
            <Search size={16} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Buscar ruta o parada..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            onPress={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-lg ${showFilter ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <Filter size={18} color={showFilter ? "#ffffff" : "#6B7280"} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Panel de filtros */}
      {showFilter && (
        <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <Text className="font-bold text-gray-800 mb-2">Filtrar por ruta:</Text>
          
          {/* Selector de origen */}
          <View className="mb-3">
            <Text className="text-gray-600 text-xs mb-1">Origen:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <TouchableOpacity 
                onPress={() => setSelectedOrigin("")}
                className={`mr-2 px-3 py-1 rounded-full ${!selectedOrigin ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={!selectedOrigin ? 'text-white' : 'text-gray-800'}>Todos</Text>
              </TouchableOpacity>
              
              {allOrigins.map(org => (
                <TouchableOpacity 
                  key={org}
                  onPress={() => setSelectedOrigin(org)}
                  className={`mr-2 px-3 py-1 rounded-full ${selectedOrigin === org ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <Text className={selectedOrigin === org ? 'text-white' : 'text-gray-800'}>{org}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Selector de destino */}
          <View className="mb-3">
            <Text className="text-gray-600 text-xs mb-1">Destino:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <TouchableOpacity 
                onPress={() => setSelectedDestination("")}
                className={`mr-2 px-3 py-1 rounded-full ${!selectedDestination ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={!selectedDestination ? 'text-white' : 'text-gray-800'}>Todos</Text>
              </TouchableOpacity>
              
              {allDestinations.map(dest => (
                <TouchableOpacity 
                  key={dest}
                  onPress={() => setSelectedDestination(dest)}
                  className={`mr-2 px-3 py-1 rounded-full ${selectedDestination === dest ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <Text className={selectedDestination === dest ? 'text-white' : 'text-gray-800'}>{dest}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Botón para resetear filtros */}
          <TouchableOpacity 
            onPress={resetFilters}
            className="self-start px-4 py-1 bg-gray-200 rounded-lg"
          >
            <Text className="text-gray-800">Reiniciar filtros</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Indicador de ruta seleccionada */}
      {(selectedOrigin || selectedDestination) && (
        <View className="flex-row items-center justify-center py-2 px-4 bg-blue-50">
          <Text className="font-medium text-gray-800">
            {selectedOrigin || 'Cualquier origen'}
          </Text>
          <ArrowRight size={16} color="#3B82F6" className="mx-2" />
          <Text className="font-medium text-gray-800">
            {selectedDestination || 'Cualquier destino'}
          </Text>
        </View>
      )}
      
      {/* Lista de viajes */}
      <ScrollView className="p-4">
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-3 text-gray-600">Carregant busos...</Text>
          </View>
        ) : filteredTrips.length > 0 ? (
          <>
            <Text className="text-gray-500 mb-4">{filteredTrips.length} viajes encontrados</Text>
            {filteredTrips.map(trip => (
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
            <Text className="text-gray-600 text-center">No hi ha busos disponibles amb aquests filtres.</Text>
            <TouchableOpacity 
              onPress={resetFilters}
              className="mt-3 px-4 py-2 bg-blue-500 rounded-lg"
            >
              <Text className="text-white">Mostrar todos los buses</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}