import { Button } from '@/components/ui/button';
import { usePortalContainer } from '@/contexts/portal-container';
import { cn } from '@/lib/utils';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
import { Popover } from '@base-ui/react/popover';
import type { BaseUIEvent } from '@base-ui/react/types';
import { SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

const CHIP_LIMIT = 3;

export interface TagsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  onClear?: () => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function cleanValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalize(value: string) {
  return cleanValue(value).toLowerCase();
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
  onClear,
  suggestions = [],
  placeholder,
  disabled = false,
  className,
}: TagsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightedItemRef = useRef<string | undefined>(undefined);
  const portalContainer = usePortalContainer();

  const [query, setQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value.map(normalize)), [value]);

  const options = useMemo(
    () => suggestions.filter((item) => !selectedSet.has(normalize(item))),
    [suggestions, selectedSet],
  );

  const cleanedQuery = cleanValue(query);

  function addTags(rawValues: string[]) {
    if (disabled) return;

    const next = [...value];
    const seen = new Set(selectedSet);

    for (const raw of rawValues) {
      const tag = cleanValue(raw);

      if (!tag) continue;

      const tagKey = tag.toLowerCase();
      if (seen.has(tagKey)) continue;

      next.push(tag);
      seen.add(tagKey);
    }

    if (next.length !== value.length) {
      onChange(next);
    }
  }

  function commitInput() {
    if (!cleanedQuery) return;
    addTags(splitValues(query));
    setQuery('');
  }

  function handleKeyDown(
    event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>,
  ) {
    if (disabled || event.nativeEvent.isComposing) return;

    if (event.key === 'Backspace' && event.currentTarget.value === '') {
      event.preventBaseUIHandler();
      return;
    }

    if (event.key === 'Enter') {
      if (!highlightedItemRef.current && cleanedQuery) {
        event.preventDefault();
        commitInput();
      }
      return;
    }

    if (event.key === ',') {
      event.preventDefault();
      if (cleanedQuery) commitInput();
      return;
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;

    const text = event.clipboardData.getData('text');
    const parts = splitValues(text);

    if (parts.length >= 2) {
      event.preventDefault();
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
      open={suggestionsOpen}
      limit={20}
      onInputValueChange={setQuery}
      onOpenChange={setSuggestionsOpen}
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
        className={cn(
          'flex min-h-9 cursor-text items-start gap-1.5 rounded-md border border-input',
          'bg-transparent bg-clip-padding px-1.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          'data-disabled:pointer-events-none data-disabled:opacity-50',
          'dark:bg-input/30',
          className,
        )}
      >
        <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Combobox.Value>
            {(selected: string[]) => {
              const visibleTags = selected.slice(0, CHIP_LIMIT);
              const hiddenCount = selected.length - visibleTags.length;

              return (
                <>
                  {visibleTags.map((tag) => (
                    <Combobox.Chip
                      key={tag}
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

                  {hiddenCount > 0 && (
                    <TagsOverflowPopover
                      tags={selected}
                      hiddenCount={hiddenCount}
                      disabled={disabled}
                      inputRef={inputRef}
                      onOpen={() => setSuggestionsOpen(false)}
                      onChange={onChange}
                      onClear={onClear}
                    />
                  )}

                  <Combobox.Input
                    ref={inputRef}
                    aria-label={placeholder ?? 'Add tag'}
                    placeholder={placeholder}
                    className="h-5.5 min-w-16 flex-1 bg-transparent pl-2 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                  />
                </>
              );
            }}
          </Combobox.Value>
        </Combobox.Chips>
      </Combobox.InputGroup>

      {options.length > 0 && (
        <Combobox.Portal container={portalContainer}>
          <Combobox.Positioner
            positionMethod="fixed"
            sideOffset={6}
            className="isolate z-50"
          >
            <Combobox.Popup
              className={cn(
                'max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-md',
                'bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
                'origin-(--transform-origin) duration-100',
                'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
                'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
                'has-data-empty:hidden',
              )}
            >
              <Combobox.List className="max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none">
                {(item: string) => (
                  <Combobox.Item
                    key={item}
                    value={item}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 select-none',
                      'rounded-sm px-2 py-1.5 text-sm outline-hidden',
                      'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                      'data-disabled:pointer-events-none data-disabled:opacity-50',
                    )}
                  >
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

interface TagsOverflowPopoverProps {
  tags: string[];
  hiddenCount: number;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onOpen: () => void;
  onChange: (next: string[]) => void;
  onClear?: () => void;
}

function TagsOverflowPopover({
  tags,
  hiddenCount,
  disabled,
  inputRef,
  onOpen,
  onChange,
  onClear,
}: TagsOverflowPopoverProps) {
  const portalContainer = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);

  function clearAll() {
    if (onClear) {
      onClear();
      return;
    }

    onChange([]);
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) onOpen();
      }}
    >
      <Popover.Trigger
        ref={triggerRef}
        disabled={disabled}
        className={cn(
          'flex h-5.5 items-center rounded-sm bg-muted px-1.5',
          'text-xs font-medium whitespace-nowrap text-foreground transition-colors',
          'hover:bg-foreground/10',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          'data-popup-open:bg-foreground/10',
        )}
      >
        +{hiddenCount} more
      </Popover.Trigger>

      <Popover.Portal container={portalContainer}>
        <Popover.Positioner
          positionMethod="fixed"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="isolate z-50"
        >
          <Popover.Popup
            aria-label="Selected tags"
            finalFocus={() => triggerRef.current ?? inputRef.current}
            className={cn(
              'flex max-h-(--available-height) w-56 flex-col overflow-hidden rounded-md',
              'bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
              'origin-(--transform-origin) duration-100 outline-none',
              'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
              'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            )}
          >
            <Autocomplete.Root
              open
              inline
              disabled={disabled}
              items={tags}
              autoHighlight="always"
              keepHighlight
            >
              <div className="relative flex h-10 shrink-0 items-center border-b border-border px-3">
                <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <Autocomplete.Input
                  aria-label="Search selected items"
                  placeholder="Search…"
                  className="h-full min-w-0 flex-1 bg-transparent pr-2 pl-6 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              <Autocomplete.Empty className="text-center text-sm text-muted-foreground">
                <div className="px-3 py-5">No matching results.</div>
              </Autocomplete.Empty>

              <Autocomplete.List className="max-h-60 min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0">
                {(item: string) => (
                  <Autocomplete.Item
                    key={item}
                    value={item}
                    aria-label={`Remove ${item}`}
                    className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                    onClick={() => onChange(tags.filter((tag) => tag !== item))}
                  >
                    <span className="min-w-0 flex-1 truncate">{item}</span>
                    <XIcon
                      aria-hidden
                      className="pointer-events-none size-3.5 shrink-0 opacity-60"
                    />
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Root>

            <div className="shrink-0 border-t border-border p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={clearAll}
              >
                Clear all
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
