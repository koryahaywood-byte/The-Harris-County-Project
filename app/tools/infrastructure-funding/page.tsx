export default function InfrastructureFunding() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 41px)" }}>
      <iframe
        src="/infrastructure-funding.html"
        className="flex-1 w-full border-0"
        title="Infrastructure Funding Map: Harris County"
        allowFullScreen
      />
    </div>
  );
}
