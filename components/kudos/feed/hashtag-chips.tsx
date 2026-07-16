const MAX_VISIBLE_HASHTAGS = 5;

type HashtagChipsProps = {
  hashtags: string[];
};

/** Hashtag line: up to 5 tags as one continuous red text row (`#a #b ...`),
 *  not boxed pills — a single `truncate`d span reproduces the design. */
export function HashtagChips({ hashtags }: HashtagChipsProps) {
  const visible = hashtags.slice(0, MAX_VISIBLE_HASHTAGS);
  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      <span className="block truncate font-montserrat text-xs font-bold tracking-[0.5px] text-details-error sm:text-base">
        {visible.map((tag) => `#${tag}`).join(" ")}
      </span>
    </div>
  );
}
