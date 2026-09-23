// Shared basemap. CARTO's keyless basemaps began returning an "API KEY
// REQUIRED" watermark on every tile (Sep 2026), so all maps use Esri's
// keyless World Light Gray canvas instead. Native tiles stop at z16; Leaflet
// upscales beyond that via maxNativeZoom.
export const BASEMAP = {
  base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
  maxNativeZoom: 16,
};
