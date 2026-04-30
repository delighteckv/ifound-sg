export function getValuableRoomId(valuableId?: string | null) {
  return valuableId ? `valuable-${valuableId.toLowerCase()}` : ""
}

export function parseValuableIdFromRoomId(roomId?: string | null) {
  if (!roomId) return ""
  const normalized = roomId.trim().toLowerCase()
  if (!normalized.startsWith("valuable-")) return ""
  return normalized.slice("valuable-".length)
}

