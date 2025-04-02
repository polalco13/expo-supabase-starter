import { supabase } from '@/config/supabase';

// Tipos
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
};

export type AllTripsResult = {
  trip_id: string;
  route_name: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  expected_arrival_time: string;
  status: string;
  delay_minutes: number;
  occupancy_level: string;
};

export type Trip = {
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
    .select('id, name')
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
      trip_id: trip.id,
      route_name: trip.routes?.name || '',
      origin_name: trip.routes?.origin?.name || '',
      destination_name: trip.routes?.destination?.name || '',
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
    .select('destination:destination_id (id, name)')
    .eq('origin_id', originId);

  if (error) {
    console.error('Error fetching destinations:', error);
    throw error;
  }

  // Extraer los destinos y eliminar duplicados (por si hay varias rutas con el mismo destino)
  const destinations = data.map((route: any) => route.destination);
  const uniqueDestinations = Array.from(
    new Map(destinations.map((dest: Location) => [dest.id, dest])).values()
  );
  
  return uniqueDestinations;
}
