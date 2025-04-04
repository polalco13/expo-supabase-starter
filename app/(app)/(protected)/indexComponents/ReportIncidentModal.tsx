import React, { useState } from "react";
import { Modal, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { X, Clock, Users, AlertCircle, MessageSquare } from "lucide-react-native";
import { reportIncident } from "@/services/api";

// Tipos de incidencias que se pueden reportar
const INCIDENT_TYPES = [
  { 
    id: 'delay', 
    icon: <Clock size={20} color="#f59e0b" />, 
    title: 'Va amb retard', 
    description: 'El bus porta més temps de retard del que indica l\'aplicació'
  },
  { 
    id: 'full_bus', 
    icon: <Users size={20} color="#ef4444" />, 
    title: 'Bus ple', 
    description: 'No hi ha seients lliures o està massa ple'
  },
  { 
    id: 'incident', 
    icon: <AlertCircle size={20} color="#dc2626" />, 
    title: 'Incidència', 
    description: 'Problemes amb el bus, conductor o servei'
  },
  { 
    id: 'other', 
    icon: <MessageSquare size={20} color="#6b7280" />, 
    title: 'Altres', 
    description: 'Altres observacions o problemes'
  }
];

interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  routeName: string;
  onReportSuccess: () => void;
}

export function ReportIncidentModal({ 
  visible, 
  onClose, 
  tripId, 
  routeName,
  onReportSuccess 
}: ReportIncidentModalProps) {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!selectedIncident) return;
    
    setIsSubmitting(true);
    try {
      await reportIncident({
        tripId,
        type: selectedIncident as any,
        comment: comment || undefined
      });
      
      // Reiniciar estado
      setSelectedIncident(null);
      setComment('');
      onReportSuccess();
      onClose();
    } catch (error) {
      console.error("Error al enviar incidencia:", error);
      // Aquí podrías mostrar un toast o alguna notificación de error
    } finally {
      setIsSubmitting(false);
    }
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
              <Text className="text-xl font-bold">Reportar incidència</Text>
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
          <ScrollView className="p-4">
            <Text className="text-gray-700 mb-4">
              Selecciona el tipus d'incidència que vols reportar:
            </Text>
            
            {/* Opciones de incidencias */}
            <View className="mb-4">
              {INCIDENT_TYPES.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  onPress={() => setSelectedIncident(incident.id)}
                  className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                    selectedIncident === incident.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-gray-200'
                  }`}
                >
                  <View className="mr-3">{incident.icon}</View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{incident.title}</Text>
                    <Text className="text-gray-600 text-sm">{incident.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Comentario opcional */}
            {selectedIncident && (
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">Afegeix un comentari (opcional):</Text>
                <View className="border border-gray-200 rounded-lg p-3">
                  <TouchableOpacity
                    onPress={() => {
                      // Aquí podrías abrir un modal con un textarea más grande
                      // o implementar un input de texto multilinea
                    }}
                  >
                    <Text className="text-gray-500">
                      Toca per afegir més detalls sobre la incidència...
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
          
          {/* Botones de acción */}
          <View className="p-4 border-t border-gray-100 mb-5">
            <Button
              className={selectedIncident ? "bg-blue-500" : "bg-gray-300"}
              onPress={handleSubmit}
              disabled={!selectedIncident || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">Enviar incidència</Text>
              )}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}