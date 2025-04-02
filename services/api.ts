import { supabase } from '@/config/supabase';

// Tipos
export type Incident = {
  id: string;
  trip_id: string;
  user_id: string;
  type: 'delay' | 'full_bus' | 'incident' | 'other';
  comment?: string;
  created_at: string;
  status: 'active' | 'resolved' | 'rejected';
  votes: number;
  resolved_at?: string;
};


export type IncidentComment = {
  id: string;
  incident_id: string;
  user_id: string;
  user_email?: string;
  content: string;
  created_at: string;
};

export type IncidentReport = {
  tripId: string;
  type: 'delay' | 'full_bus' | 'incident' | 'other';
  comment?: string;
};

export type Location = {
  id: string;
  name: string;
};

export type Route = {
  id: string;
  name: string;
  origin: Location;
  destination: Location;
  description?: string;
  num_ruta?: string;
};

export type AllTripsResult = {
  trip_id: string;
  route_name: string;
  route_num?: string; // Añadir el campo
  origin_name: string;
  destination_name: string;
  departure_time: string;
  expected_arrival_time: string;
  status: string;
  delay_minutes: number;
  occupancy_level: string;
};

export type Trip = {
  origin_num_ruta: string | undefined;
  id: string;
  route_name: string;
  departure_time: string;
  expected_arrival_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  delay_minutes: number;
  occupancy_level: 'empty' | 'low' | 'medium' | 'high' | 'full' | 'unknown';
};

export type ReportType = 'delay' | 'full_bus' | 'incident' | 'other';

// 🔧 Función auxiliar
function getCurrentDayType(): 'weekday' | 'sabado' | 'domingo' {
  const day = new Date().getDay(); // 0 = domingo, 6 = sábado
  if (day === 0) return 'domingo';
  if (day === 6) return 'sabado';
  return 'weekday';
}

// 📌 Obtener ubicaciones
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, num_ruta')
    .order('name');

  if (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }

  return data || [];
}

export async function getNextTrips(origin: string, destination: string): Promise<Trip[]> {
  const now = new Date();
  const localTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const dayType = getCurrentDayType();
  console.log('[getNextTrips] Hora local:', localTime, 'Tipo de día:', dayType);
  console.log('[getNextTrips] Buscando viajes de:', origin, 'a', destination);

  try {
    // Aumentamos significativamente el límite para asegurarnos de tener suficientes opciones
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id, 
        departure_time,
        expected_arrival_time,
        status,
        delay_minutes,
        occupancy_level,
        routes:route_id (
          id,
          name,
          num_ruta,
          origin:origin_id (id, name),
          destination:destination_id (id, name)
        )
      `)
      .eq('day_type', dayType)
      .gte('departure_time', localTime + ':00')
      .order('departure_time')
      .limit(300);

    if (error) {
      console.error('[getNextTrips] Error en consulta:', error);
      return [];
    }

    console.log(`[getNextTrips] Total de viajes obtenidos antes de filtrar: ${data?.length || 0}`);

    // Formatear viajes y extraer información relevante
    const formattedTrips = (data || []).map(trip => ({
      id: trip.id,
      route_name: trip.routes?.name || 'Ruta desconeguda',
      route_num: trip.routes?.num_ruta || '', // Añadir el número de ruta
      origin_name: trip.routes?.origin?.name || 'Origen desconegut',
      destination_name: trip.routes?.destination?.name || 'Destí desconegut',
      departure_time: trip.departure_time?.substring(0, 5) || '',
      expected_arrival_time: trip.expected_arrival_time?.substring(0, 5) || '',
      status: trip.status || 'scheduled',
      delay_minutes: trip.delay_minutes || 0,
      occupancy_level: trip.occupancy_level || 'unknown'
    }));
    // Aplicar el filtro
    const matchingTrips = formattedTrips.filter(trip => {
      const originMatch = trip.origin_name.toLowerCase().includes(origin.toLowerCase());
      const destMatch = trip.destination_name.toLowerCase().includes(destination.toLowerCase());
      return originMatch && destMatch;
    });

    console.log(`[getNextTrips] Encontrados ${matchingTrips.length} viajes que coinciden`);
    
    // Log detallado de los viajes encontrados
    matchingTrips.forEach((trip, index) => {
      console.log(`[getNextTrips] Viaje #${index + 1}: ${trip.origin_name} → ${trip.destination_name} a las ${trip.departure_time}`);
    });
    
    // Limitamos a los primeros 3 resultados
    const result = matchingTrips.slice(0, 3);
    console.log(`[getNextTrips] Retornando ${result.length} viajes`);
    
    return result;
  } catch (e) {
    console.error('[getNextTrips] Excepción:', e);
    return [];
  }
}
// 📅 Obtener todos los viajes según tipo de día
export async function getAllTripsByDay(selectedDay: string, origin: string, destination: string): Promise<AllTripsResult[]> {
  const dayMapping: Record<string, 'weekday' | 'sabado' | 'domingo'> = {
    'domingo': 'domingo', 'diumenge': 'domingo',
    'sábado': 'sabado', 'dissabte': 'sabado',
    'lunes': 'weekday', 'dilluns': 'weekday',
    'martes': 'weekday', 'dimarts': 'weekday',
    'miércoles': 'weekday', 'dimecres': 'weekday',
    'jueves': 'weekday', 'dijous': 'weekday',
    'viernes': 'weekday', 'divendres': 'weekday'
  };

  const normalized = selectedDay.toLowerCase();
  const dayType = dayMapping[normalized] || getCurrentDayType();

  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id, 
        departure_time,
        expected_arrival_time,
        status,
        delay_minutes,
        occupancy_level,
        routes:route_id (
          id,
          name,
          num_ruta,
          origin:origin_id (id, name),
          destination:destination_id (id, name)
        )
      `)
      .eq('day_type', dayType)
      .order('departure_time');

    if (error) {
      console.error('Error en consulta:', error);
      return [];
    }

    const formattedTrips = (data || []).map(trip => ({
      id: trip.id,
      route_name: trip.routes?.name || 'Ruta desconeguda',
      route_num: trip.routes?.num_ruta || '', // Añadir el número de ruta
      origin_name: trip.routes?.origin?.name || 'Origen desconegut',
      destination_name: trip.routes?.destination?.name || 'Destí desconegut',
      departure_time: trip.departure_time?.substring(0, 5) || '',
      expected_arrival_time: trip.expected_arrival_time?.substring(0, 5) || '',
      status: trip.status || 'scheduled',
      delay_minutes: trip.delay_minutes || 0,
      occupancy_level: trip.occupancy_level || 'unknown'
    }));

    return formattedTrips.filter(trip => {
      const originMatch = trip.origin_name.toLowerCase().includes(origin.toLowerCase());
      const destMatch = trip.destination_name.toLowerCase().includes(destination.toLowerCase());
      return originMatch && destMatch;
    });

  } catch (e) {
    console.error('Excepción en getAllTripsByDay:', e);
    return [];
  }
}

// Función para obtener destinos disponibles según el origen seleccionado
export async function getDestinationsByOrigin(originId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('destination:destination_id (id, name, num_ruta)')
    .eq('origin_id', originId);

  if (error) {
    console.error('Error fetching destinations:', error);
    throw error;
  }

  // Extraer los destinos y eliminar duplicados
  const destinations = data.map((route: any) => route.destination);
  const uniqueDestinations = Array.from(
    new Map(destinations.map((dest: Location) => [dest.id, dest])).values()
  );
  
  return uniqueDestinations;
}

export async function reportIncident(report: IncidentReport): Promise<Incident> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      trip_id: report.tripId,
      user_id: user.id,
      type: report.type,
      comment: report.comment,
      status: 'active',
      votes: 1
    })
    .select('*')
    .single();
  
  if (error) {
    console.error('Error al reportar incidencia:', error);
    throw error;
  }
  
  return data;
}

// Función para obtener incidencias activas para un viaje
export async function getTripIncidents(tripId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener incidencias:', error);
    throw error;
  }
  
  return data || [];
}

// Función para votar por una incidencia (confirmar que otros están experimentando lo mismo)
export async function voteIncident(incidentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  // Primero registramos el voto del usuario
  const { error: voteError } = await supabase
    .from('incident_votes')
    .insert({
      incident_id: incidentId,
      user_id: user.id
    });
  
  if (voteError) {
    // Si el error es por restricción unique, es porque el usuario ya votó
    if (voteError.code === '23505') {
      return;
    }
    console.error('Error al votar incidencia:', voteError);
    throw voteError;
  }
  
  // Luego incrementamos el contador de votos
  const { error: updateError } = await supabase
    .rpc('increment_incident_votes', { incident_id: incidentId });
  
  if (updateError) {
    console.error('Error al actualizar votos:', updateError);
    throw updateError;
  }
}

// Función para obtener un resumen de incidencias para varios viajes
export async function getIncidentsSummary(tripIds: string[]): Promise<Record<string, { count: number, types: ('delay' | 'full_bus' | 'incident' | 'other')[] }>> {
  if (tripIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('incidents')
    .select('id, trip_id, type')
    .in('trip_id', tripIds)
    .eq('status', 'active');
  
  if (error) {
    console.error('Error al obtener resumen de incidencias:', error);
    throw error;
  }
  
  // Agrupar incidencias por viaje
  const summary: Record<string, { count: number, types: ('delay' | 'full_bus' | 'incident' | 'other')[] }> = {};
  
  data.forEach(incident => {
    if (!summary[incident.trip_id]) {
      summary[incident.trip_id] = { count: 0, types: [] };
    }
    
    summary[incident.trip_id].count++;
    
    if (!summary[incident.trip_id].types.includes(incident.type)) {
      summary[incident.trip_id].types.push(incident.type);
    }
  });
  
  return summary;
}

export async function getAllActiveIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      id, 
      trip_id,
      user_id,
      type,
      comment,
      created_at,
      status,
      votes,
      trips:trip_id (
        id,
        route_id,
        routes:route_id (
          id,
          name,
          origin_id,
          destination_id,
          origins:origin_id (id, name),
          destinations:destination_id (id, name)
        )
      ),
      (SELECT count(*) FROM incident_comments WHERE incident_id = incidents.id) as comment_count
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener incidencias activas:', error);
    throw error;
  }
  
  // Formatear los datos para facilitar su uso
  return (data || []).map(incident => ({
    id: incident.id,
    trip_id: incident.trip_id,
    user_id: incident.user_id,
    type: incident.type,
    comment: incident.comment,
    created_at: incident.created_at,
    status: incident.status,
    votes: incident.votes,
    route_name: incident.trips?.routes?.name || 'Desconeguda',
    origin_name: incident.trips?.routes?.origins?.name || 'Origen desconegut',
    destination_name: incident.trips?.routes?.destinations?.name || 'Destí desconegut',
    comment_count: incident.comment_count || 0
  }));
}

// Función para obtener detalles de una incidencia específica
export async function getIncidentDetails(incidentId: string): Promise<Incident> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Primero obtenemos la incidencia
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      id, 
      trip_id,
      user_id,
      type,
      comment,
      created_at,
      status,
      votes,
      trips:trip_id (
        id,
        route_id,
        routes:route_id (
          id,
          name,
          origin_id,
          destination_id,
          origins:origin_id (id, name),
          destinations:destination_id (id, name)
        )
      )
    `)
    .eq('id', incidentId)
    .single();
  
  if (error) {
    console.error('Error al obtener detalles de incidencia:', error);
    throw error;
  }
  
  // Verificar si el usuario actual ya ha votado esta incidencia
  let userHasVoted = false;
  
  if (user) {
    const { data: voteData, error: voteError } = await supabase
      .from('incident_votes')
      .select('id')
      .eq('incident_id', incidentId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!voteError && voteData) {
      userHasVoted = true;
    }
  }
  
  // Formatear los datos
  return {
    id: data.id,
    trip_id: data.trip_id,
    user_id: data.user_id,
    type: data.type,
    comment: data.comment,
    created_at: data.created_at,
    status: data.status,
    votes: data.votes,
    route_name: data.trips?.routes?.name || 'Desconeguda',
    origin_name: data.trips?.routes?.origins?.name || 'Origen desconegut',
    destination_name: data.trips?.routes?.destinations?.name || 'Destí desconegut',
    user_has_voted: userHasVoted
  };
}

// Función para obtener comentarios de una incidencia
export async function getIncidentComments(incidentId: string): Promise<IncidentComment[]> {
  const { data, error } = await supabase
    .from('incident_comments')
    .select(`
      id,
      incident_id,
      user_id,
      content,
      created_at,
      users:user_id (email)
    `)
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error al obtener comentarios:', error);
    throw error;
  }
  
  // Formatear datos con información del usuario
  return (data || []).map(comment => ({
    id: comment.id,
    incident_id: comment.incident_id,
    user_id: comment.user_id,
    user_email: comment.users?.email,
    content: comment.content,
    created_at: comment.created_at
  }));
}

// Función para añadir un comentario a una incidencia
export async function addIncidentComment(incidentId: string, content: string): Promise<IncidentComment> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const { data, error } = await supabase
    .from('incident_comments')
    .insert({
      incident_id: incidentId,
      user_id: user.id,
      content: content
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error al añadir comentario:', error);
    throw error;
  }
  
  // Devolver con la información del usuario
  return {
    id: data.id,
    incident_id: data.incident_id,
    user_id: data.user_id,
    user_email: user.email,
    content: data.content,
    created_at: data.created_at
  };
}

// Función para incorporar incidencias a la navegación principal
export function addIncidentsNavigation(router: any) {
  // Puedes usar esta función para navegar a las vistas de incidencias desde tu componente principal
  return {
    goToAllIncidents: () => {
      router.push('/all-incidents');
    },
    goToIncidentDetail: (id: string) => {
      router.push({
        pathname: '/incident-detail',
        params: { id }
      });
    }
  };
}