import { PortalContainerProvider } from '@/contexts/portal-container';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TagsInput, type TagsInputProps } from './tags-input';

interface TagsInputHarnessProps extends Omit<
  TagsInputProps,
  'value' | 'onChange'
> {
  initialValue?: string[];
  onValueChange?: (next: string[]) => void;
}

function TagsInputHarness({
  initialValue = [],
  onValueChange,
  ...props
}: TagsInputHarnessProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <PortalContainerProvider container={document.body}>
      <TagsInput
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
    </PortalContainerProvider>
  );
}

function setupTagsInput(props: TagsInputHarnessProps = {}) {
  const onValueChange = vi.fn<(next: string[]) => void>();
  const user = userEvent.setup();

  render(<TagsInputHarness {...props} onValueChange={onValueChange} />);

  return {
    user,
    onValueChange,
    input: screen.getByRole('combobox', {
      name: props.placeholder ?? 'Add tag',
    }),
  };
}

describe('TagsInput', () => {
  it('adds cleaned freeform values and rejects normalized duplicates', async () => {
    const { user, input, onValueChange } = setupTagsInput();

    await user.type(input, '  Acme   Corp{Enter}');

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(onValueChange).toHaveBeenLastCalledWith(['Acme Corp']);

    await user.type(input, 'acme corp{Enter}');

    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('adds multiple comma- and newline-delimited values from a paste', async () => {
    const { user, input, onValueChange } = setupTagsInput();

    await user.click(input);
    await user.paste('Backend, C#\nStaff');

    expect(onValueChange).toHaveBeenLastCalledWith(['Backend', 'C#', 'Staff']);
    expect(input).toHaveValue('');
  });

  it('adds a highlighted suggestion with the keyboard', async () => {
    const { user, input, onValueChange } = setupTagsInput({
      suggestions: ['Mercor', 'Meta'],
    });

    await user.type(input, 'Merc');
    await screen.findByRole('option', { name: 'Mercor' });
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith(['Mercor']);
    expect(screen.getByText('Mercor')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('removes the final hidden tag and restores focus to the entry input', async () => {
    const { user, input, onValueChange } = setupTagsInput({
      initialValue: ['Acme', 'Beta', 'Gamma', 'Delta'],
    });

    await user.click(screen.getByRole('button', { name: '+1 more' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Selected tags',
    });
    expect(
      within(dialog).getByRole('combobox', {
        name: 'Search selected items',
      }),
    ).toHaveFocus();

    await user.click(
      within(dialog).getByRole('option', { name: 'Remove Delta' }),
    );

    expect(onValueChange).toHaveBeenLastCalledWith(['Acme', 'Beta', 'Gamma']);
    expect(
      screen.queryByRole('button', { name: '+1 more' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('keeps the suggestions and overflow popups mutually exclusive', async () => {
    const { user, input } = setupTagsInput({
      initialValue: ['Acme', 'Beta', 'Gamma', 'Delta'],
      suggestions: ['Epsilon'],
    });

    await user.type(input, 'Eps');
    await screen.findByRole('option', { name: 'Epsilon' });

    await user.click(screen.getByText('+1 more'));

    await screen.findByRole('dialog', { name: 'Selected tags' });
    await waitFor(() =>
      expect(
        screen.queryByRole('option', { name: 'Epsilon' }),
      ).not.toBeInTheDocument(),
    );

    await user.click(input);

    await screen.findByRole('option', { name: 'Epsilon' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Selected tags' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('preserves tags on Escape', async () => {
    const { user, input } = setupTagsInput({
      initialValue: ['Acme'],
    });

    await user.type(input, 'draft');
    await user.keyboard('{Escape}');

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not remove tags with Backspace from an empty input', async () => {
    const { user, input, onValueChange } = setupTagsInput({
      initialValue: ['Acme', 'Beta', 'Gamma', 'Delta'],
    });

    await user.type(input, 'draft');
    await user.keyboard(
      '{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}',
    );

    expect(input).toHaveValue('');
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
