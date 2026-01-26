export type NavItem = {
  readonly labelKey: string;
  readonly link: string;
  readonly active?: boolean;
  readonly permission?: {
    readonly resource: string;
    readonly action: string;
  };
  readonly anyPermissions?: ReadonlyArray<{
    readonly resource: string;
    readonly action: string;
  }>;
};
