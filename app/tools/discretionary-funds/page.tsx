export default function DiscretionaryFunds() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 41px)" }}>
      <iframe
        src="/discretionary-funds.html"
        className="flex-1 w-full border-0"
        title="Discretionary Funds Map — Houston City Council"
        allowFullScreen
      />
    </div>
  );
}
