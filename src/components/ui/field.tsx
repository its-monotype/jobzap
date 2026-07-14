import { cn } from '@/lib/utils';
import { Field as FieldPrimitive } from '@base-ui/react/field';

function Field(props: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return (
    <FieldPrimitive.Root
      {...props}
      data-slot="field"
      className={cn('flex w-full flex-col gap-2', props.className)}
    />
  );
}

function FieldLabel(props: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      {...props}
      data-slot="field-label"
      className={cn('text-sm font-medium', props.className)}
    />
  );
}

function FieldDescription(
  props: React.ComponentProps<typeof FieldPrimitive.Description>,
) {
  return (
    <FieldPrimitive.Description
      {...props}
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', props.className)}
    />
  );
}

function FieldError(props: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      {...props}
      data-slot="field-error"
      className={cn('text-sm text-destructive', props.className)}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldLabel };
