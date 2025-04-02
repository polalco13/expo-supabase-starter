import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Clock, Users, AlertCircle, MessageSquare, ArrowLeft, ThumbsUp, Send } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  getIncidentDetails, 
  getIncidentComments, 
  voteIncident, 
  addIncidentComment, 
  Incident, 
  IncidentComment 
} from "@/services/api";
import { Image } from "@/components/image";
import { useSupabase } from "@/context/supabase-provider";

export default function IncidentDetailView() {
  const { id } = useLocalSearchParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { user } = useSupabase();

  useEffect(() => {
    if (id) {
      loadIncidentData();
    }
  }, [id]);

  const loadIncidentData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Cargar detalles de la incidencia
      const incidentData = await getIncidentDetails(id as string);
      setIncident(incidentData);
      
      // Cargar comentarios
      const commentsData = await getIncidentComments(id as string);
      setComments(commentsData);
      
      // Verificar si el usuario ya ha votado esta incidencia
      setHasVoted(incidentData.user_has_voted || false);
    } catch (error) {
      console.error("Error al cargar datos de incidencia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!incident || hasVoted || voting) return;
    
    setVoting(true);
    try {
      await voteIncident(incident.id);
      // Actualizar localmente
      setIncident({
        ...incident,
        votes: incident.votes + 1
      });
      setHasVoted(true);
    } catch (error) {
      console.error("Error al votar:", error);
    } finally {
      setVoting(false);
    }
  };

  const handleSendComment = async () => {
    if (!incident || !comment.trim() || commenting) return;
    
    setCommenting(true);
    try {
      const newComment = await addIncidentComment(incident.id, comment.trim());
      
      // Añadir el comentario a la lista
      setComments([...comments, newComment]);
      
      // Limpiar el campo de comentario
      setComment("");
      
      // Hacer scroll al final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Cerrar teclado
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error al enviar comentario:", error);
    } finally {
      setCommenting(false);
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'delay':
        return <Clock size={24} color="#f59e0b" />;
      case 'full_bus':
        return <Users size={24} color="#ef4444" />;
      case 'incident':
        return <AlertCircle size={24} color="#dc2626" />;
      case 'other':
      default:
        return <MessageSquare size={24} color="#6b7280" />;
    }
  };

  const getIncidentTitle = (type: string) => {
    switch (type) {
      case 'delay':
        return 'Retard';
      case 'full_bus':
        return 'Bus ple';
      case 'incident':
        return 'Incidència';
      case 'other':
      default:
        return 'Altres';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="bg-blue-500 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Detall d'incidència</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-3 text-gray-600">Carregant detalls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="bg-blue-500 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Detall d'incidència</Text>
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-700 text-center">No s'ha trobat aquesta incidència o ha estat resolta.</Text>
          <Button className="mt-4 bg-blue-500" onPress={() => router.back()}>
            <Text className="text-white">Tornar enrere</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="bg-blue-500 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Detall d'incidència</Text>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Cabecera de la incidencia */}
          <View className="bg-white p-4 mb-2">
            <View className="flex-row items-center mb-3">
              {getIncidentIcon(incident.type)}
              <View className="ml-3">
                <Text className="text-xl font-bold">{getIncidentTitle(incident.type)}</Text>
                <Text className="text-gray-500">Reportat {formatDateTime(incident.created_at)}</Text>
              </View>
            </View>
            
            <View className="bg-gray-50 p-3 rounded-lg mb-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Línia: {incident.route_name || 'Desconeguda'}</Text>
              </View>
              
              <View className="flex-row items-center mb-1">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-gray-600">{incident.origin_name || 'Origen desconegut'}</Text>
              </View>
              
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <Text className="text-gray-600">{incident.destination_name || 'Destí desconegut'}</Text>
              </View>
            </View>
            
            {incident.comment && (
              <View className="mb-3">
                <Text className="text-gray-700 font-medium mb-1">Descripció:</Text>
                <Text className="text-gray-800 bg-gray-50 p-3 rounded-lg">{incident.comment}</Text>
              </View>
            )}
            
            {/* Botón para votar/confirmar la incidencia */}
            <TouchableOpacity 
              onPress={handleVote}
              disabled={hasVoted || voting}
              className={`flex-row items-center justify-center py-3 rounded-lg ${
                hasVoted ? 'bg-gray-100' : 'bg-blue-500'
              }`}
            >
              {voting ? (
                <ActivityIndicator size="small" color={hasVoted ? "#4b5563" : "#ffffff"} />
              ) : (
                <>
                  <ThumbsUp size={20} color={hasVoted ? "#4b5563" : "#ffffff"} />
                  <Text className={`ml-2 font-bold ${hasVoted ? 'text-gray-600' : 'text-white'}`}>
                    {hasVoted ? 'Has confirmat aquesta incidència' : 'Confirmar aquesta incidència'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-gray-600">
                <Text className="font-semibold">{incident.votes}</Text> {incident.votes === 1 ? 'usuari ha' : 'usuaris han'} confirmat
              </Text>
              <Text className="text-gray-500 text-xs">{comments.length} comentaris</Text>
            </View>
          </View>
          
          {/* Sección de comentarios */}
          <View className="bg-white p-4 flex-1">
            <Text className="text-lg font-bold mb-3">Comentaris</Text>
            
            {comments.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center mb-2">Encara no hi ha comentaris</Text>
                <Text className="text-gray-400 text-center text-sm">Sigues el primer a comentar aquesta incidència</Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <View key={comment.id} className={`mb-4 ${index !== comments.length - 1 ? 'border-b border-gray-100 pb-4' : ''}`}>
                  <View className="flex-row mb-2">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-500 font-bold">
                        {comment.user_email ? comment.user_email.substring(0, 1).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="font-medium">
                          {comment.user_email ? comment.user_email.split('@')[0] : 'Usuari anònim'}
                        </Text>
                        <Text className="text-gray-400 text-xs">{formatDateTime(comment.created_at)}</Text>
                      </View>
                      <Text className="mt-1 text-gray-700">{comment.content}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        
        {/* Input para comentario */}
        <View className="bg-white p-3 border-t border-gray-200 flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 text-gray-700"
            placeholder="Escriu un comentari..."
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={250}
          />
          <TouchableOpacity 
            onPress={handleSendComment}
            disabled={!comment.trim() || commenting}
            className={`p-2 rounded-full ${
              !comment.trim() || commenting ? 'bg-gray-200' : 'bg-blue-500'
            }`}
          >
            {commenting ? (
              <ActivityIndicator size="small" color={!comment.trim() ? "#9ca3af" : "#ffffff"} />
            ) : (
              <Send size={20} color={!comment.trim() ? "#9ca3af" : "#ffffff"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}