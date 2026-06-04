export default function WhereIsTheDough() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 41px)" }}>
      <iframe
        src="/wheres-the-dough.html"
        className="flex-1 w-full border-0"
        title="Where Is the Dough — Harris County Campaign Finance"
        allowFullScreen
      />
    </div>
  );
}
