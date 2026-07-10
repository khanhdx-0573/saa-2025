import { CheckIcon } from "@/components/kudos/kudos-icons";
import type { Hashtag } from "@/lib/kudos/types";

type HashtagPickerRowProps = {
  hashtag: Hashtag;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
};

/**
 * Single row inside the HashtagPicker list. Purely presentational: the parent
 * (HashtagPicker) decides `selected`/`disabled`, this component only renders
 * the row and forwards the click.
 */
export function HashtagPickerRow({ hashtag, selected, disabled, onToggle }: HashtagPickerRowProps) {
  const rowClassName = [
    "flex h-10 w-full items-center justify-between gap-2 rounded-xs px-4 text-left font-montserrat text-base font-bold text-details-text-secondary-1",
    selected ? "bg-details-dropdown-list-selected" : "",
    !selected && !disabled ? "hover:bg-details-dropdown-list-selected" : "",
    disabled ? "cursor-default opacity-40" : "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li role="option" aria-selected={selected} className="w-full list-none">
      <button
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        onClick={disabled ? undefined : onToggle}
        className={rowClassName}
      >
        <span className="truncate">{`#${hashtag.name}`}</span>
        {/* Fixed 24x24 slot: reserved whether selected or not, so toggling never shifts the row layout. */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          {selected ? <CheckIcon /> : null}
        </span>
      </button>
    </li>
  );
}
