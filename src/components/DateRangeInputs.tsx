export function DateRangeInputs() {
  return (
    <div className="flex gap-4">
      <input
        type="date"
        placeholder="Check-in"
        className="flex-1 px-8 py-5 text-lg rounded-lg bg-transparent border border-white border-opacity-40 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#005254]"
      />
      <input
        type="date"
        placeholder="Check-out"
        className="flex-1 px-8 py-5 text-lg rounded-lg bg-transparent border border-white border-opacity-40 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#005254]"
      />
    </div>
  );
}
