import type {
  MapCoordinate,
  MapMeasurementMode,
  MapMeasurementState,
} from './contracts'

const EARTH_RADIUS_METERS = 6_371_008.8
const degreesToRadians = Math.PI / 180

function normalizedLongitudeDelta(delta: number) {
  if (delta > Math.PI) return delta - 2 * Math.PI
  if (delta < -Math.PI) return delta + 2 * Math.PI
  return delta
}

export function calculateDistanceMeters(coordinates: readonly MapCoordinate[]) {
  let distance = 0

  for (let index = 1; index < coordinates.length; index += 1) {
    const [previousLongitude, previousLatitude] = coordinates[index - 1]
    const [longitude, latitude] = coordinates[index]
    const latitudeDelta = (latitude - previousLatitude) * degreesToRadians
    const longitudeDelta = (longitude - previousLongitude) * degreesToRadians
    const previousLatitudeRadians = previousLatitude * degreesToRadians
    const latitudeRadians = latitude * degreesToRadians
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(previousLatitudeRadians) *
        Math.cos(latitudeRadians) *
        Math.sin(longitudeDelta / 2) ** 2

    distance +=
      2 *
      EARTH_RADIUS_METERS *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  }

  return distance
}

export function calculateAreaSquareMeters(
  coordinates: readonly MapCoordinate[],
) {
  if (coordinates.length < 3) return 0

  let sum = 0
  for (let index = 0; index < coordinates.length; index += 1) {
    const [longitude, latitude] = coordinates[index]
    const [nextLongitude, nextLatitude] =
      coordinates[(index + 1) % coordinates.length]
    const longitudeDelta = normalizedLongitudeDelta(
      (nextLongitude - longitude) * degreesToRadians,
    )
    sum +=
      longitudeDelta *
      (2 +
        Math.sin(latitude * degreesToRadians) +
        Math.sin(nextLatitude * degreesToRadians))
  }

  return Math.abs((sum * EARTH_RADIUS_METERS ** 2) / 2)
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value)
}

export function formatMeasurement(mode: MapMeasurementMode, value: number) {
  if (mode === 'distance') {
    return value < 1_000
      ? `${formatNumber(value, 0)} m`
      : `${formatNumber(value / 1_000, 2)} km`
  }

  return value < 1_000_000
    ? `${formatNumber(value, 0)} m²`
    : `${formatNumber(value / 1_000_000, 2)} km²`
}

export function createMeasurementState(
  mode: MapMeasurementMode | null,
  coordinates: readonly MapCoordinate[] = [],
): MapMeasurementState {
  if (!mode)
    return { mode: null, coordinates: [], value: null, formatted: null }

  const minimumPoints = mode === 'distance' ? 2 : 3
  if (coordinates.length < minimumPoints) {
    return { mode, coordinates: [...coordinates], value: null, formatted: null }
  }

  const value =
    mode === 'distance'
      ? calculateDistanceMeters(coordinates)
      : calculateAreaSquareMeters(coordinates)

  return {
    mode,
    coordinates: [...coordinates],
    value,
    formatted: formatMeasurement(mode, value),
  }
}
