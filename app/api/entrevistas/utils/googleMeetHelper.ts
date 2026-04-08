export function extractMeetLink(event: any): string | null {
  // Try primary hangoutLink property
  if (event?.data?.hangoutLink) {
    return event.data.hangoutLink;
  }
  // Fallback to conferenceData.entryPoints[0].uri if present
  const entryPoints = event?.data?.conferenceData?.entryPoints;
  if (Array.isArray(entryPoints) && entryPoints.length > 0) {
    const meetEntry = entryPoints.find((ep: any) => ep?.uri && ep?.entryPointType === 'video');
    if (meetEntry?.uri) return meetEntry.uri;
    // If not specifically video, return first uri
    if (entryPoints[0]?.uri) return entryPoints[0].uri;
  }
  // As a last resort, construct a placeholder using event id
  if (event?.data?.id) {
    return `https://meet.google.com/${event.data.id}`;
  }
  return null;
}
