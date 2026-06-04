export default function WhereIsTheDough() {
  return (
    <div style={{ height: "calc(100dvh - 4rem)" }} className="flex flex-col">
      <iframe
        src="/wheres-the-dough.html"
        className="flex-1 w-full border-0"
        title="Where Is the Dough — Harris County Campaign Finance"
        allowFullScreen
      />
    </div>
  );
}
