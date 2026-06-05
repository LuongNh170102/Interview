import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateProductRequest,
  PRODUCT_STATUS,
  ProductStatusValue,
  ProductResponse,
  SelectOption,
  TranslatePipe,
} from '@vhandelivery/shared-ui';
import { CustomSelectComponent } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    CustomSelectComponent,
  ],
  templateUrl: './product-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() merchantOptions: SelectOption[] = [];
  @Input() categoryOptions: SelectOption[] = [];
  @Input() initialProduct: ProductResponse | null = null;
  @Input() isSubmitting = false;
  @Input() lockMerchantSelection = false;

  readonly submitForm = output<CreateProductRequest>();
  readonly cancel = output<void>();
  readonly existingImageUrls = signal<string[]>([]);
  readonly imagePreviewUrls = signal<string[]>([]);
  readonly isDragActive = signal(false);

  private readonly maxNewImageUploads = 10;
  private imageFiles: File[] = [];

  readonly statusOptions: SelectOption[] = [
    {
      value: PRODUCT_STATUS.DRAFT,
      label: 'admin.productsPage.status.draft',
    },
    {
      value: PRODUCT_STATUS.PUBLISHED,
      label: 'admin.productsPage.status.published',
    },
    {
      value: PRODUCT_STATUS.ARCHIVED,
      label: 'admin.productsPage.status.archived',
    },
  ];

  readonly form = this.fb.nonNullable.group({
    merchantId: ['', [Validators.required]],
    categoryId: [''],
    nameVi: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: [''],
    descriptionVi: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    sku: ['', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    status: this.fb.nonNullable.control<ProductStatusValue>(
      PRODUCT_STATUS.DRAFT,
      {
        validators: [Validators.required],
      }
    ),
    isActive: [true],
    currency: ['VND'],
  });

  ngOnInit(): void {
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['initialProduct'] && !changes['initialProduct'].firstChange) ||
      changes['merchantOptions'] ||
      changes['lockMerchantSelection']
    ) {
      this.patchForm();
    }
  }

  ngOnDestroy(): void {
    this.revokeImagePreviews();
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getErrorKey(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return 'common.validation.required';
    }
    if (field?.hasError('minlength')) {
      return 'common.validation.minLength';
    }
    if (field?.hasError('min')) {
      return 'common.validation.invalidFormat';
    }
    return 'common.validation.invalidFormat';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.submitForm.emit({
      merchantId: rawValue.merchantId,
      categoryId: rawValue.categoryId || undefined,
      name: {
        vi: rawValue.nameVi,
        en: rawValue.nameEn || rawValue.nameVi,
      },
      description: rawValue.descriptionVi
        ? {
            en: rawValue.descriptionVi,
            vi: rawValue.descriptionVi,
          }
        : undefined,
      price: Number(rawValue.price),
      sku: rawValue.sku,
      stock: Number(rawValue.stock),
      status: rawValue.status,
      isActive: rawValue.isActive,
      currency: rawValue.currency,
      imageFiles: this.imageFiles.length ? [...this.imageFiles] : undefined,
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.appendImageFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    this.isDragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    const currentTarget = event.currentTarget as Node | null;
    const relatedTarget = event.relatedTarget as Node | null;

    if (
      currentTarget &&
      relatedTarget &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    this.isDragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
    this.appendImageFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  removeImagePreview(index: number): void {
    const previewUrl = this.imagePreviewUrls()[index];

    if (!previewUrl) {
      return;
    }

    URL.revokeObjectURL(previewUrl);
    this.imageFiles = this.imageFiles.filter(
      (_, fileIndex) => fileIndex !== index
    );
    this.imagePreviewUrls.update((current) =>
      current.filter((_, previewIndex) => previewIndex !== index)
    );
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private patchForm(): void {
    const product = this.initialProduct;
    const merchantControl = this.form.get('merchantId');

    if (!product) {
      const merchantId =
        this.lockMerchantSelection && this.merchantOptions.length > 0
          ? this.merchantOptions[0].value
          : '';

      if (this.lockMerchantSelection) {
        merchantControl?.disable({ emitEvent: false });
      } else {
        merchantControl?.enable({ emitEvent: false });
      }

      this.form.reset({
        merchantId,
        categoryId: '',
        nameVi: '',
        nameEn: '',
        descriptionVi: '',
        price: 0,
        sku: '',
        stock: 0,
        status: PRODUCT_STATUS.DRAFT,
        isActive: true,
        currency: 'VND',
      });
      this.existingImageUrls.set([]);
      this.clearImages();
      return;
    }

    merchantControl?.disable({ emitEvent: false });
    this.existingImageUrls.set(this.collectExistingImageUrls(product));
    this.clearImages();

    const productName = this.readLocalized(product.name);
    const productDescription = this.readLocalized(product.description);

    this.form.patchValue({
      merchantId: product.merchant?.externalId ?? '',
      categoryId: product.category?.externalId ?? '',
      nameVi: productName.vi,
      nameEn: productName.en,
      descriptionVi: productDescription.vi,
      price: product.price ?? 0,
      sku: product.sku ?? '',
      stock: product.stock ?? 0,
      status: product.status,
      isActive: product.isActive ?? true,
      currency: product.currency ?? 'VND',
    });
  }

  private readLocalized(
    value: ProductResponse['name'] | ProductResponse['description']
  ): { vi: string; en: string } {
    if (!value) {
      return { vi: '', en: '' };
    }

    if (typeof value === 'string') {
      return { vi: value, en: '' };
    }

    return {
      vi: value.vi ?? value.en ?? '',
      en: value.en ?? '',
    };
  }

  private clearImages(): void {
    this.imageFiles = [];
    this.isDragActive.set(false);
    this.revokeImagePreviews();
    this.imagePreviewUrls.set([]);
  }

  private appendImageFiles(files: File[]): void {
    const remainingSlots = Math.max(
      this.maxNewImageUploads - this.imageFiles.length,
      0
    );

    if (!remainingSlots) {
      return;
    }

    const acceptedFiles = files
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    if (!acceptedFiles.length) {
      return;
    }

    this.imageFiles = [...this.imageFiles, ...acceptedFiles];
    this.imagePreviewUrls.update((current) => [
      ...current,
      ...acceptedFiles.map((file) => URL.createObjectURL(file)),
    ]);
  }

  private collectExistingImageUrls(product: ProductResponse): string[] {
    const imageSet = new Set<string>();

    if (product.thumbnail) {
      imageSet.add(product.thumbnail);
    }

    product.images.forEach((image) => {
      if (image) {
        imageSet.add(image);
      }
    });

    return [...imageSet];
  }

  private revokeImagePreviews(): void {
    this.imagePreviewUrls().forEach((url) => URL.revokeObjectURL(url));
  }
}
