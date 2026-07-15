/**
 * Shared SVG icons for the Kudos compose feature. Each mirrors a Figma media
 * asset (id noted per icon). Kept in one module so icons reused across fields
 * (Plus, Close, Link) are defined once instead of copied per file.
 */

/** MM_MEDIA_Bold (mms_C.1_bold, componentId 662:10957) */
export function BoldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.5 15.5H10V12.5H13.5C13.8978 12.5 14.2794 12.658 14.5607 12.9393C14.842 13.2206 15 13.6022 15 14C15 14.3978 14.842 14.7794 14.5607 15.0607C14.2794 15.342 13.8978 15.5 13.5 15.5ZM10 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8C14.5 8.39782 14.342 8.77936 14.0607 9.06066C13.7794 9.34196 13.3978 9.5 13 9.5H10M15.6 10.79C16.57 10.11 17.25 9 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.14 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Italic (mms_C.2_italic, componentId 662:10945) */
export function ItalicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" fill="currentColor" />
    </svg>
  );
}

/** MM_MEDIA_Strikethrough (mms_C.3_Stroke, componentId 662:10950) */
export function StrikeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.62432 9.37769C6.42432 7.07769 8.12432 4.37769 10.5243 3.87769C13.6243 2.87769 18.1243 4.27769 18.0243 8.07769H15.0243C15.0243 7.77769 14.9243 7.47769 14.9243 7.27769C14.7243 6.67769 14.3243 6.37769 13.7243 6.17769C12.9243 5.87769 11.6243 5.97769 10.9243 6.47769C9.42432 7.77769 10.8243 9.07769 12.4243 9.57769H7.82432C7.72432 9.47769 7.72432 9.37769 7.62432 9.37769ZM21.4243 12.5777V10.5777H3.42432V12.5777H13.0243C13.2243 12.6777 13.4243 12.6777 13.6243 12.7777C14.2243 13.0777 14.7243 13.2777 14.9243 13.8777C15.0243 14.2777 15.1243 14.7777 14.9243 15.1777C14.7243 15.6777 14.3243 15.8777 13.8243 16.0777C12.0243 16.5777 9.82432 15.8777 9.92432 13.6777H6.92432C6.82432 16.2777 9.02432 18.0777 11.4243 18.3777C15.2243 19.1777 19.7243 16.7777 17.7243 12.4777L21.4243 12.5777Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Number List (mms_C.4_number, componentId 662:10338) */
export function ListIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 13V11H21V13H7ZM7 19V17H21V19H7ZM7 7V5H21V7H7ZM3 8V5H2V4H4V8H3ZM2 17V16H5V20H2V19H4V18.5H3V17.5H4V17H2ZM4.25 10C4.44891 10 4.63968 10.079 4.78033 10.2197C4.92098 10.3603 5 10.5511 5 10.75C5 10.95 4.92 11.14 4.79 11.27L3.12 13H5V14H2V13.08L4 11H2V10H4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Link (mms_C.5_link, componentId 256:5195) */
export function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.9619 13.1547C11.3719 13.5447 11.3719 14.1847 10.9619 14.5747C10.5719 14.9647 9.93189 14.9647 9.54189 14.5747C7.5919 12.6247 7.5919 9.4547 9.54189 7.5047L13.0819 3.9647C15.0319 2.0147 18.2019 2.0147 20.1519 3.9647C22.1019 5.9147 22.1019 9.0847 20.1519 11.0347L18.6619 12.5247C18.6719 11.7047 18.5419 10.8847 18.2619 10.1047L18.7319 9.6247C19.9119 8.4547 19.9119 6.5547 18.7319 5.3847C17.5619 4.2047 15.6619 4.2047 14.4919 5.3847L10.9619 8.9147C9.7819 10.0847 9.7819 11.9847 10.9619 13.1547ZM13.7819 8.9147C14.1719 8.5247 14.8119 8.5247 15.2019 8.9147C17.1519 10.8647 17.1519 14.0347 15.2019 15.9847L11.6619 19.5247C9.71189 21.4747 6.54189 21.4747 4.59189 19.5247C2.64189 17.5747 2.64189 14.4047 4.59189 12.4547L6.08189 10.9647C6.07189 11.7847 6.20189 12.6047 6.48189 13.3947L6.01189 13.8647C4.83189 15.0347 4.83189 16.9347 6.01189 18.1047C7.18189 19.2847 9.08189 19.2847 10.2519 18.1047L13.7819 14.5747C14.9619 13.4047 14.9619 11.5047 13.7819 10.3347C13.3719 9.9447 13.3719 9.3047 13.7819 8.9147Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Quote (mms_C.6_quote, componentId 662:10343) */
export function QuoteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.9999 6V14H14.8799L12.8799 18H18.6199L20.9999 13.24V6M14.9999 8H18.9999V12.76L17.3799 16H16.1199L18.1199 12H14.9999M2.99988 6V14H4.87988L2.87988 18H8.61988L10.9999 13.24V6M4.99988 8H8.99988V12.76L7.37988 16H6.11988L8.11988 12H4.99988V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Close (mms_H.1_Button, componentId 214:3851) */
export function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.4759 12.0972L19.0159 17.6372V19.0972H17.5559L12.0159 13.5572L6.47587 19.0972H5.01587V17.6372L10.5559 12.0972L5.01587 6.55717V5.09717H6.47587L12.0159 10.6372L17.5559 5.09717H19.0159V6.55717L13.4759 12.0972Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Close Tiny (componentId 490:5771) */
export function CloseTinyIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path
        d="M4.49187 4.09701L6.33854 5.94367V6.43034H5.85187L4.00521 4.58367L2.15854 6.43034H1.67188V5.94367L3.51854 4.09701L1.67188 2.25034V1.76367H2.15854L4.00521 3.61034L5.85187 1.76367H6.33854V2.25034L4.49187 4.09701Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Send (mms_H.2_Button, componentId 256:5140) */
export function SendIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.9043 20.4797V4.47974L21.9043 12.4797M4.9043 17.4797L16.7543 12.4797L4.9043 7.47974V10.9797L10.9043 12.4797L4.9043 13.9797M4.9043 17.4797V7.47974V13.9797V17.4797Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Plus (componentId 490:5726) */
export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
    </svg>
  );
}

/** MM_MEDIA_Down (mms_B.2_Search, componentId 186:1862) */
export function DownIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-details-text-primary-2"
    >
      <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
    </svg>
  );
}

/** Fallback shown in the recipient dropdown when a Sunner has no avatar_url. */
export function PersonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** MM_MEDIA_Pen (mms_A.1_Button ghi nhận, componentId 214:3812) */
export function PenIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20.8067 6.72951C21.1967 6.33951 21.1967 5.68951 20.8067 5.31951L18.4667 2.97951C18.0967 2.58951 17.4467 2.58951 17.0567 2.97951L15.2167 4.80951L18.9667 8.55951M3.09668 16.9395V20.6895H6.84668L17.9067 9.61951L14.1567 5.86951L3.09668 16.9395Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Selected-row check mark inside the hashtag picker. */
export function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-details-text-secondary-1"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 12.3l2.6 2.6L16 9.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
