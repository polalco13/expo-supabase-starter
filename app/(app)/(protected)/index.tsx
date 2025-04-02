import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H2 } from "@/components/ui/typography";
import { MapPin, List, ChevronUp, ChevronDown, Calendar, Clock, AlertCircle } from "lucide-react-native";
import Constants from 'expo-constants';
import { SearchBar } from "./indexComponents/SearchBar";
import { DaySelector } from "./indexComponents/DaySelector";
import { BusCard } from "./indexComponents/BusCard";
import { LocationSelector } from "./indexComponents/LocationSelector";
import { AllTripsView } from "./indexComponents/AllTripsView";
import { 
  getLocations, 
  getNextTrips, 
  getAllTripsByDay, 
  getDestinationsByOrigin,
  getIncidenciesByRoute,
  Trip, 
  AllTripsResult,
  Location 
} from "../../../services/api";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  // Estados para ubicaciones
  const [locations, setLocations] = useState<Location[]>([]);
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedDay, setSelectedDay] = useState("Hoy");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingField, setSelectingField] = useState<'origin' | 'destination' | null>(null);
  
  // Estados para viajes
  const [trips, setTrips] = useState<Trip[]>([]);
  const [allTrips, setAllTrips] = useState<AllTripsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [allTripsLoading, setAllTripsLoading] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);
  
  // Estado para la interfaz
  const [searchExpanded, setSearchExpanded] = useState(false);
  
  // Estado para incidencias (unificado)
  const [incidenciesByRoute, setIncidenciesByRoute] = useState<Record<string, { count: number, types: ('delay' | 'full_bus' | 'incident' | 'other')[] }>>({});
  
  // Lista de destinos filtrados según el origen seleccionado
  const [destinations, setDestinations] = useState<Location[]>([]);

  const days = ["Hoy", "Mañana", "Lunes", "Martes", "Miércoles"];
  const statusBarHeight = Constants.statusBarHeight || 0;
  const router = useRouter();

  // Cargar todas las ubicaciones al iniciar
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationData = await getLocations();
        setLocations(locationData);
        if (locationData.length > 0) {
          // Establecemos valores por defecto y cargamos destinos para el origen por defecto
          setOrigin(locationData[0]);
          if (locationData.length > 1) {
            setDestination(locationData[1]);
          }
          const dests = await getDestinationsByOrigin(locationData[0].id);
          setDestinations(dests);
          if (!dests.find(dest => locationData[1] && dest.id === locationData[1].id)) {
            setDestination(dests.length > 0 ? dests[0] : null);
          }
        }
      } catch (error) {
        console.error("Error loading locations:", error);
      }
    };
    loadLocations();
  }, []);

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    if (destination) {
      // Al intercambiar, se recargan los destinos para el nuevo origen
      getDestinationsByOrigin(destination.id)
        .then(setDestinations)
        .catch(console.error);
    }
  };

  const openModal = (field: 'origin' | 'destination') => {
    setSelectingField(field);
    setModalVisible(true);
  };

  // Al seleccionar un origen se actualiza y se consultan los destinos disponibles
  const handleOriginSelect = async (selectedOrigin: Location) => {
    setOrigin(selectedOrigin);
    try {
      const dests = await getDestinationsByOrigin(selectedOrigin.id);
      setDestinations(dests);
      // Si el destino actual no forma parte de los destinos disponibles se reinicia
      if (!destination || !dests.find(dest => dest.id === destination.id)) {
        setDestination(dests.length > 0 ? dests[0] : null);
      }
    } catch (error) {
      console.error("Error fetching destinations by origin:", error);
    }
  };

  // Función para manejar la selección del modal
  const handleSelectLocation = (locationName: string) => {
    const selectedLocation = locations.find(loc => loc.name === locationName);
    if (selectedLocation) {
      if (selectingField === 'origin') {
        handleOriginSelect(selectedLocation);
      } else if (selectingField === 'destination') {
        setDestination(selectedLocation);
      }
    }
    setModalVisible(false);
  };

  const handleSearch = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      // Se usa el nombre de la ubicación para la búsqueda
      const tripsData = await getNextTrips(origin.name, destination.name);
      setTrips(tripsData.slice(0, 3));
      
      // Cargar incidencias para esta ruta (unificadas)
      const incidences = await getIncidenciesByRoute(origin.name, destination.name);
      setIncidenciesByRoute(incidences);
    } catch (error) {
      console.error("Error searching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllTrips = async () => {
    if (!origin || !destination) return;
    setAllTripsLoading(true);
    try {
      const allTripsData = await getAllTripsByDay(selectedDay, origin.name, destination.name);
      setAllTrips(allTripsData);
      
      // No necesitamos cargar incidencias de nuevo, ya las tenemos
      setShowAllTrips(true);
    } catch (error) {
      console.error("Error loading all trips:", error);
    } finally {
      setAllTripsLoading(false);
    }
  };

  // Función para manejar el éxito del reporte de incidencia
  const handleReportSuccess = async () => {
    // Recargar incidencias para toda la ruta
    if (origin && destination) {
      try {
        const incidences = await getIncidenciesByRoute(origin.name, destination.name);
        setIncidenciesByRoute(incidences);
      } catch (error) {
        console.error("Error refreshing incidents:", error);
      }
    }
  };

  // Actualizar los viajes cuando cambian origen o destino
  useEffect(() => {
    if (origin && destination) {
      handleSearch();
    }
  }, [origin, destination]);

  const toggleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView className="flex-1">
        {/* Header con barra de búsqueda */}
        <View className="bg-blue-500 rounded-b-3xl shadow" style={{ paddingTop: statusBarHeight + 12 }}>
          <View className="px-4 pb-6">
            <H2 className="text-white mb-3">Troba el teu bus</H2>
            <TouchableOpacity 
              onPress={toggleSearchExpanded}
              className="flex-row items-center justify-between mb-4 bg-blue-400 p-3 rounded-xl shadow"
            >
              <View className="flex-row items-center flex-1">
                {searchExpanded ? (
                  <>
                    <MapPin size={18} color="white" />
                    <Text className="text-white ml-2 text-base">Ubicació actual</Text>
                  </>
                ) : (
                  <View className="flex-row items-center flex-1">
                    <View className="bg-white/20 px-3 py-1.5 rounded-lg flex-1 mr-2 flex-row items-center">
                      <Text className="text-white ml-2 font-medium text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {origin ? origin.name : "Selecciona origen"}
                      </Text>
                    </View>
                    <View className="h-6 w-0.5 bg-white/40 mx-1" />
                    <View className="bg-white/20 px-3 py-1.5 rounded-lg flex-1 flex-row items-center">
                      <Text className="text-white ml-2 font-medium text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {destination ? destination.name : "Selecciona destí"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View className="bg-white/30 p-1.5 rounded-full ml-2">
                {searchExpanded ? 
                  <ChevronUp size={18} color="white" /> : 
                  <ChevronDown size={18} color="white" />
                }
              </View>
            </TouchableOpacity>
            {searchExpanded && (
              <SearchBar 
                origin={origin ? origin.name : ""}
                destination={destination ? destination.name : ""}
                onOriginPress={() => openModal('origin')}
                onDestinationPress={() => openModal('destination')}
                onSwap={handleSwapLocations}
                onSearch={handleSearch}
              />
            )}
          </View>
        </View>

        {/* Sección de próximos buses */}
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Clock size={20} color="#3B82F6" />
              <Text className="text-xl font-bold text-gray-800 ml-2">Pròxims busos</Text>
            </View>
            <Text className="text-gray-500 text-sm">Temps real</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow mb-6">
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-600">Buscant busos...</Text>
              </View>
            ) : trips.length > 0 ? (
              trips.slice(0, 3).map(trip => (
                <BusCard 
                  key={trip.id}
                  id={trip.id}
                  line={trip.route_name}
                  origin={origin ? origin.name : ""}
                  destination={destination ? destination.name : ""}
                  time={trip.departure_time}
                  routeNumber={trip.route_num}
                  incidents={incidenciesByRoute[trip.id]}
                  onReportSuccess={handleReportSuccess}
                />
              ))
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-600">No hay busos disponibles para esta ruta.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Separador y sección de horarios */}
        <View className="h-2 bg-gray-200" />
        <View className="px-4 pt-6 pb-20">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Calendar size={20} color="#3B82F6" />
              <Text className="text-xl font-bold text-gray-800 ml-2">Horaris per dia</Text>
            </View>
          </View>
          <View className="mb-4">
            <DaySelector 
              days={days}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </View>
          
          {/* Botón Veure tots els horaris mejorado */}
          <View className="mb-4 bg-white rounded-xl overflow-hidden shadow">
            <View className="px-4 py-3 bg-blue-50">
              <Text className="text-blue-800 font-medium">Consulta l'horari complet</Text>
            </View>
            
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Origen</Text>
                  <Text className="font-semibold text-gray-800" numberOfLines={1} ellipsizeMode="tail">
                    {origin ? origin.name : "Selecciona origen"}
                  </Text>
                </View>
                <View className="mx-2">
                  <Text className="text-gray-400">→</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Destí</Text>
                  <Text className="font-semibold text-gray-800" numberOfLines={1} ellipsizeMode="tail">
                    {destination ? destination.name : "Selecciona destí"}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={handleShowAllTrips}
                className="bg-blue-500 py-3 rounded-lg flex-row justify-center items-center"
                activeOpacity={0.8}
              >
                <Calendar size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  Veure tots els horaris
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <LocationSelector 
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectLocation}
          title={selectingField === 'origin' ? 'Selecciona origen' : 'Selecciona destí'}
          locations={selectingField === 'origin' 
            ? locations.map(loc => loc.name) 
            : destinations.map(dest => dest.name)}
        />
      </ScrollView>

      {showAllTrips && (
        <View className="absolute inset-0 bg-black/70">
          <AllTripsView 
            trips={allTrips}
            loading={allTripsLoading}
            selectedDay={selectedDay}
            origin={origin ? origin.name : ""}
            destination={destination ? destination.name : ""}
            incidenciesByRoute={incidenciesByRoute}
            onClose={() => setShowAllTrips(false)}
          />
        </View>
      )}
      
      {/* Botón flotante para ver todas las incidencias */}
      <TouchableOpacity
        onPress={() => router.push('/all-incidents')}
        className="absolute bottom-24 right-4 bg-blue-500 w-14 h-14 rounded-full shadow-lg items-center justify-center"
        style={{ elevation: 5 }}
      >
        <AlertCircle size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}