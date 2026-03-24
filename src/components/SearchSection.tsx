import { SearchInput } from "./SearchInput";
import { DateRangeInputs } from "./DateRangeInputs";
import { SearchButton } from "./SearchButton";

export function SearchSection() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative z-10 px-4">
      <div className="w-full max-w-5xl space-y-4">
        <h1 className="text-5xl font-bold text-white mb-6">
          Search for Hotels
        </h1>
        <SearchInput />
        <DateRangeInputs />
        <SearchButton />
      </div>
    </div>
  );
}
