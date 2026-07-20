/** Browser GPS helper — no map dependencies */
export function detectBrowserLocation(
  onOk: (lat: number, lng: number) => void,
  onFail?: () => void
) {
  if (!navigator.geolocation) {
    onFail?.();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (p) => onOk(p.coords.latitude, p.coords.longitude),
    () => onFail?.(),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
