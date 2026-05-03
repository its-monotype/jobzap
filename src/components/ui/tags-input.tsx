import { usePortalContainer } from '@/contexts/portal-container';
import { cn } from '@/lib/utils';
import { Combobox } from '@base-ui/react/combobox';
import { CheckIcon, XIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export interface TagsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  allowDuplicates?: boolean;
  maxTags?: number;
  className?: string;
}

function cleanValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalize(value: string) {
  return cleanValue(value).toLocaleLowerCase();
}

function splitValues(text: string) {
  return text
    .split(/[\n,]+/)
    .map(cleanValue)
    .filter(Boolean);
}

export function TagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  disabled = false,
  invalid = false,
  allowDuplicates = false,
  maxTags,
  className,
}: TagsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightedItemRef = useRef<string | undefined>(undefined);
  const portalContainer = usePortalContainer();

  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const selectedSet = useMemo(() => new Set(value.map(normalize)), [value]);

  const options = useMemo(() => {
    if (allowDuplicates) return suggestions;
    return suggestions.filter((item) => !selectedSet.has(normalize(item)));
  }, [allowDuplicates, suggestions, selectedSet]);

  const normalizedQuery = cleanValue(query);

  function addTags(rawValues: string[]) {
    if (disabled) return;

    const next = [...value];
    const seen = allowDuplicates ? null : new Set(selectedSet);

    for (const raw of rawValues) {
      const tag = cleanValue(raw);
      const tagKey = normalize(tag);

      if (!tag) continue;
      if (seen?.has(tagKey)) continue;
      if (maxTags !== undefined && next.length >= maxTags) break;

      next.push(tag);
      seen?.add(tagKey);
    }

    if (next.length !== value.length) {
      onChange(next);
    }
  }

  function commitInput() {
    if (!normalizedQuery) return;
    addTags(splitValues(query));
    setQuery('');
  }

  function removeLast() {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled || isComposing) return;

    if (e.key === 'Enter') {
      if (!highlightedItemRef.current && normalizedQuery) {
        e.preventDefault();
        commitInput();
      }
      return;
    }

    if (e.key === ',' && normalizedQuery) {
      e.preventDefault();
      commitInput();
      return;
    }

    if (e.key === 'Backspace' && query === '') {
      removeLast();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;

    const text = e.clipboardData.getData('text');
    const parts = splitValues(text);

    if (parts.length >= 2) {
      e.preventDefault();
      addTags(parts);
      setQuery('');
    }
  }

  return (
    <Combobox.Root
      multiple
      disabled={disabled}
      items={options}
      value={value}
      inputValue={query}
      limit={20}
      onInputValueChange={setQuery}
      onItemHighlighted={(item) => {
        highlightedItemRef.current = item;
      }}
      onValueChange={(next, eventDetails) => {
        if (eventDetails.reason === 'escape-key') {
          eventDetails.cancel(); // prevents Base UI from resetting all tags
          setQuery('');
          return;
        }
        onChange(next);
      }}
    >
      <Combobox.InputGroup
        aria-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          'flex min-h-9 cursor-text items-start gap-1.5 rounded-md border border-input',
          'bg-transparent bg-clip-padding px-1.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          'has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20',
          'data-disabled:pointer-events-none data-disabled:opacity-50',
          'dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40',
          className,
        )}
      >
        <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Combobox.Value>
            {(selected: string[]) => (
              <>
                {selected.map((tag, index) => (
                  <Combobox.Chip
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={`${tag}:${index}`}
                    className="flex h-5.5 cursor-default items-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground"
                  >
                    <span className="max-w-48 truncate">{tag}</span>
                    <Combobox.ChipRemove
                      aria-label={`Remove ${tag}`}
                      className="flex size-4 items-center justify-center rounded-sm opacity-50 hover:opacity-100"
                    >
                      <XIcon className="size-3" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}

                <Combobox.Input
                  ref={inputRef}
                  placeholder={placeholder}
                  className="h-5.5 min-w-16 flex-1 bg-transparent pl-2 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
              </>
            )}
          </Combobox.Value>
        </Combobox.Chips>

        <Combobox.Clear
          aria-label="Clear all"
          className="flex size-5 shrink-0 items-center justify-center self-center rounded-sm opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <XIcon className="size-3.5" />
        </Combobox.Clear>
      </Combobox.InputGroup>

      {options.length > 0 && (
        <Combobox.Portal container={portalContainer}>
          <Combobox.Positioner
            sideOffset={6}
            className="isolate z-50 outline-none"
          >
            <Combobox.Popup
              className={cn(
                'max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-md',
                'bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
                'origin-(--transform-origin) duration-100',
                'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
                'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
                '[&:has([data-empty])]:hidden',
              )}
            >
              <Combobox.List className="no-scrollbar max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none">
                {(item: string) => (
                  <Combobox.Item
                    key={item}
                    value={item}
                    className={cn(
                      'relative flex w-full cursor-default items-center gap-2 select-none',
                      'rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
                      'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                      'data-disabled:pointer-events-none data-disabled:opacity-50',
                    )}
                  >
                    <Combobox.ItemIndicator
                      render={
                        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                      }
                    >
                      <CheckIcon className="pointer-events-none size-4" />
                    </Combobox.ItemIndicator>
                    <span className="truncate">{item}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  );
}
