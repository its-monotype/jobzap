import { cn } from '@/lib/utils';
import { Field as FieldPrimitive } from '@base-ui/react/field';

function Field(props: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn('flex w-full flex-col gap-2', props.className)}
      {...props}
    />
  );
}

function FieldLabel(props: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn('text-sm font-medium', props.className)}
      {...props}
    />
  );
}

function FieldDescription(
  props: React.ComponentProps<typeof FieldPrimitive.Description>,
) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', props.className)}
      {...props}
    />
  );
}

function FieldError(props: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn('text-sm text-destructive', props.className)}
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldLabel };
