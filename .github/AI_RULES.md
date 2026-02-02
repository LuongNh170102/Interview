# VhanDelivery AI Code Review Rules

> Extracted from COPILOT_INSTRUCTIONS.prompt.md
> AI reviewer MUST enforce these rules strictly

---

## 🚨 CRITICAL (Block PR if violated)

### TypeScript

- ❌ NO `any` type - use proper types or `unknown`
- ❌ NO `var` - use `const` or `let`
- ✅ Explicit return types for all functions
- ✅ Use `readonly` for immutable properties

### Angular Components

- ❌ NO NgModules - all components MUST be `standalone: true`
- ❌ NO `ChangeDetectionStrategy.Default` - MUST use `OnPush`
- ❌ NO constructor injection - use `inject()` function
- ❌ NO manual `.subscribe()` without cleanup
- ✅ Use `takeUntilDestroyed()` or `DestroyRef` for subscriptions
- ✅ Use Signals for reactive state (`signal()`, `computed()`)
- ✅ Use `async` pipe for Observables in templates

### RxJS

- ❌ NO nested subscriptions (subscribe inside subscribe)
- ✅ Use higher-order operators: `switchMap`, `mergeMap`, `concatMap`
- ✅ Use `shareReplay()` for shared streams
- ✅ Implement `catchError` for error handling

### Styling

- ❌ NO custom SCSS unless absolutely necessary
- ❌ NO inline hex colors (e.g., `#f35b2a`)
- ❌ NO Tailwind default palette (e.g., `text-white`, `bg-gray-500`)
- ✅ Use Tailwind CSS utilities as PRIMARY method
- ✅ Use CSS variables from `_variables.scss` (e.g., `var(--color-primary)`)
- ✅ Use design tokens (e.g., `text-content-on-primary`, `bg-surface-base`)

### Internationalization (i18n)

- ❌ NO hardcoded text in templates or components
- ✅ Use `{{ 'key.path' | translate }}` pipe
- ✅ Use `{{ object.name | localizedText }}` for LocalizedString
- ✅ Translation keys MUST be lowercase dot paths

---

## ⚠️ WARNING (Suggest fix but don't block)

### Performance

- Prefer `trackBy` function for `*ngFor` loops
- Use `loading="lazy"` for images
- Prefer rem-based arbitrary sizes over px-based
- Follow 8px grid spacing (0.5rem, 1rem, 1.5rem, 2rem...)

### Accessibility

- Semantic HTML elements required
- ARIA attributes: `role`, `aria-label`, `aria-describedby`
- Keyboard navigation support (tab order, Enter/Space handlers)
- Alt text for images
- Form labels and error messages

### NestJS Backend

- Use DTOs with `class-validator` decorators
- Apply proper HTTP exception handling
- Use Swagger decorators for API documentation
- Use Prisma service for database operations

### Code Organization

- Common code MUST be in `shared` library (`@vhandelivery/shared-ui`)
- NO duplicate code across applications (DRY principle)
- Feature-specific logic stays in `app/feature/`

---

## 📝 INFO (Minor suggestions)

### Naming Conventions

- File names: kebab-case (e.g., `order-list.component.ts`)
- Boolean variables: prefix with `is`, `has`, `should`
- Translation keys: lowercase dot paths

### Commit Messages

Follow conventional commits:

- `feat(scope): description`
- `fix(scope): description`
- `refactor(scope): description`

---

## ✅ Good Patterns to Praise

```typescript
// ✅ Correct component structure
@Component({
  selector: 'app-feature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureComponent {
  private readonly service = inject(ServiceName);
  readonly state = signal<StateType>({});
  readonly computed = computed(() => this.state().property);
}

// ✅ Correct subscription handling
private readonly destroyRef = inject(DestroyRef);
this.service.getData()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe();

// ✅ Correct i18n usage
<h1>{{ 'auth.login.title' | translate }}</h1>
<p>{{ product.name | localizedText }}</p>
```
