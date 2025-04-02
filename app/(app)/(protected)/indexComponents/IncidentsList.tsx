import React, { useState, useEffect } from "react";
import { View, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { X, Clock, Users, AlertCircle, MessageSquare, ThumbsUp } from "lucide-react-native";
import { getTripIncidents, voteIncident, Incident } from "@/services/api";

interface IncidentsListProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  routeName: string;
}

export function IncidentsList({ visible, onClose, tripId, routeName }: IncidentsListProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && tripId) {
      loadIncidents();
    }
  }, [visible, tripId]);

  const loadIncidents = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      const data = await getTripIncidents(tripId);
      setIncidents(data);
    } catch (error) {
      console.error("Error al cargar incidencias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (incidentId: string) => {
    if (votingIds.has(incidentId)) return;
    
    setVotingIds(prev => new Set(prev).add(incidentId));
    try {
      await voteIncident(incidentId);
      // Actualizar localmente el contador de votos
      setIncidents(prev => 
        prev.map(inc => 
          inc.id === incidentId 
            ? { ...inc, votes: inc.votes + 1 } 
            : inc
        )
      );
    } catch (error) {
      console.error("Error al votar:", error);
    } finally {
      // Después de un momento, permitimos votar nuevamente (por si falló)
      setTimeout(() => {
        setVotingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(incidentId);
          return newSet;
        });
      }, 2000);
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'delay':
        return <Clock size={20} color="#f59e0b" />;
      case 'full_bus':
        return <Users size={20} color="#ef4444" />;
      case 'incident':
        return <AlertCircle size={20} color="#dc2626" />;
      case 'other':
      default:
        return <MessageSquare size={20} color="#6b7280" />;
    }
  };

  const getIncidentTitle = (type: string) => {
    switch (type) {
      case 'delay':
        return 'Va amb retard';
      case 'full_bus':
        return 'Bus ple';
      case 'incident':
        return 'Incidència';
      case 'other':
      default:
        return 'Altres';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'fa uns segons';
    if (diffMins < 60) return `fa ${diffMins} ${diffMins === 1 ? 'minut' : 'minuts'}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `fa ${diffHours} ${diffHours === 1 ? 'hora' : 'hores'}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `fa ${diffDays} ${diffDays === 1 ? 'dia' : 'dies'}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-2xl max-h-[80%]">
          {/* Cabecera */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View>
              <Text className="text-xl font-bold">Incidències reportades</Text>
              <Text className="text-gray-500">{routeName}</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              className="p-2 bg-gray-100 rounded-full"
            >
              <X size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          {/* Contenido */}
          {loading ? (
            <View className="p-10 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-3 text-gray-600">Carregant incidències...</Text>
            </View>
          ) : incidents.length > 0 ? (
            <ScrollView className="p-4">
              <Text className="text-gray-700 mb-4">
                {incidents.length} {incidents.length === 1 ? 'incidència' : 'incidències'} reportades per aquest bus:
              </Text>
              
              {incidents.map(incident => (
                <View key={incident.id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <View className="bg-gray-50 p-3 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      {getIncidentIcon(incident.type)}
                      <Text className="font-semibold ml-2">{getIncidentTitle(incident.type)}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs">{formatTimeAgo(incident.created_at)}</Text>
                  </View>
                  
                  {incident.comment && (
                    <View className="p-3 border-t border-gray-100">
                      <Text className="text-gray-700">{incident.comment}</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    onPress={() => handleVote(incident.id)} 
                    className="p-3 border-t border-gray-100 flex-row items-center justify-between bg-gray-50"
                  >
                    <Text className="text-gray-500 text-sm">També ho he experimentat</Text>
                    <View className="flex-row items-center">
                      <ThumbsUp size={16} color={votingIds.has(incident.id) ? "#3B82F6" : "#6b7280"} />
                      <Text className="ml-1 text-gray-700">{incident.votes}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="p-10 items-center">
              <Text className="text-gray-600">No hi ha incidències reportades per aquest bus.</Text>
            </View>
          )}
          
          {/* Pie de página */}
          <View className="p-4 border-t border-gray-100">
            <TouchableOpacity 
              onPress={onClose}
              className="py-2"
            >
              <Text className="text-center text-blue-500 font-medium">Tancar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}