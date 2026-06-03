export default function HeatCheck() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
      <iframe
        src="/heat-check.html"
        className="flex-1 w-full border-0"
        title="Heat Check — Harris County Precinct Map"
      />
    </div>
  );
}
