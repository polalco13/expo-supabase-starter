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
  [x: string]: string | undefined;
  id: string;
  route_name: string;
  departure_time: string;
  expected_arrival_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  delay_minutes: number;
  occupancy_level: 'empty' | 'low' | 'medium' | 'high' | 'full' | 'unknown';
  has_passed?: boolean; // Nuevo campo para indicar si el bus ya pasó
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
  
  // Creamos una fecha 15 minutos en el pasado
  const fifteenMinutesAgo = new Date(now);
  fifteenMinutesAgo.setMinutes(now.getMinutes() - 15);
  
  // Formateamos para la consulta
  const localTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const pastTime = `${fifteenMinutesAgo.getHours().toString().padStart(2, '0')}:${fifteenMinutesAgo.getMinutes().toString().padStart(2, '0')}`;
  
  const dayType = getCurrentDayType();
  console.log('[getNextTrips] Hora local:', localTime, 'Hora límite pasada:', pastTime, 'Tipo de día:', dayType);
  console.log('[getNextTrips] Buscando viajes de:', origin, 'a', destination);

  try {
    // Modificamos la consulta para incluir buses desde hace 15 minutos
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
      .gte('departure_time', pastTime + ':00') // Incluimos desde 15 min atrás
      .order('departure_time')
      .limit(300);

    if (error) {
      console.error('[getNextTrips] Error en consulta:', error);
      return [];
    }

    console.log(`[getNextTrips] Total de viajes obtenidos antes de filtrar: ${data?.length || 0}`);

    // Formateamos los viajes como antes...
    const formattedTrips = (data || []).map(trip => ({
      id: trip.id,
      route_name: trip.routes?.name || 'Ruta desconeguda',
      route_num: trip.routes?.num_ruta || '',
      origin_name: trip.routes?.origin?.name || 'Origen desconegut',
      destination_name: trip.routes?.destination?.name || 'Destí desconegut',
      departure_time: trip.departure_time?.substring(0, 5) || '',
      expected_arrival_time: trip.expected_arrival_time?.substring(0, 5) || '',
      status: trip.status || 'scheduled',
      delay_minutes: trip.delay_minutes || 0,
      occupancy_level: trip.occupancy_level || 'unknown',
      // Añadimos un campo para saber si el bus ya ha pasado
      has_passed: trip.departure_time < localTime
    }));

    // Aplicamos el filtro como antes...
    const matchingTrips = formattedTrips.filter(trip => {
      const originMatch = trip.origin_name.toLowerCase().includes(origin.toLowerCase());
      const destMatch = trip.destination_name.toLowerCase().includes(destination.toLowerCase());
      return originMatch && destMatch;
    });

    console.log(`[getNextTrips] Encontrados ${matchingTrips.length} viajes que coinciden`);
    
    // Limitamos a los primeros resultados
    const result = matchingTrips.slice(0, 6); // Aumentamos el límite para mostrar más buses
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

export async function getIncidenciesByRoute(originName: string, destinationName: string): Promise<Record<string, { count: number, types: ('delay' | 'full_bus' | 'incident' | 'other')[] }>> {
  try {
    // Obtenemos todas las incidencias activas para la ruta especificada
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        id,
        type,
        trips:trip_id (
          id,
          route_id,
          routes:route_id (
            id,
            origin:origin_id (id, name),
            destination:destination_id (id, name)
          )
        )
      `)
      .eq('status', 'active');
    
    if (error) {
      console.error('Error al obtener incidencias por ruta:', error);
      throw error;
    }
    
    // Filtrar incidencias por origen y destino
    const filteredIncidents = (data || []).filter(incident => {
      const origin = incident.trips?.routes?.origin?.name || '';
      const destination = incident.trips?.routes?.destination?.name || '';
      
      // Verificar si coincide con origen y destino proporcionados
      const originMatch = origin.toLowerCase().includes(originName.toLowerCase()) || 
                          originName.toLowerCase().includes(origin.toLowerCase());
      
      const destMatch = destination.toLowerCase().includes(destinationName.toLowerCase()) || 
                        destinationName.toLowerCase().includes(destination.toLowerCase());
      
      return originMatch && destMatch;
    });
    
    // Agrupar por trip_id
    const incidentsByTrip: Record<string, { count: number, types: ('delay' | 'full_bus' | 'incident' | 'other')[] }> = {};
    
    filteredIncidents.forEach(incident => {
      const tripId = incident.trips?.id;
      
      if (tripId) {
        if (!incidentsByTrip[tripId]) {
          incidentsByTrip[tripId] = { count: 0, types: [] };
        }
        
        incidentsByTrip[tripId].count++;
        
        if (!incidentsByTrip[tripId].types.includes(incident.type)) {
          incidentsByTrip[tripId].types.push(incident.type);
        }
      }
    });
    
    return incidentsByTrip;
  } catch (error) {
    console.error('Error en getIncidenciesByRoute:', error);
    return {};
  }
}

