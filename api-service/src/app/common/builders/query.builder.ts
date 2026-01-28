/**
 * Base Query Builder class for building Prisma where clauses
 * Uses fluent API pattern for method chaining
 *
 * @template TWhereInput - The Prisma WhereInput type for the entity
 */
export abstract class QueryBuilder<TWhereInput> {
  protected where: TWhereInput = {} as TWhereInput;

  /**
   * Build and return the final where clause
   */
  build(): TWhereInput {
    return this.where;
  }

  /**
   * Check if the where clause has any conditions
   */
  hasConditions(): boolean {
    return Object.keys(this.where as object).length > 0;
  }

  /**
   * Reset the where clause
   */
  reset(): this {
    this.where = {} as TWhereInput;
    return this;
  }

  /**
   * Add a raw condition to the where clause
   */
  addCondition<K extends keyof TWhereInput>(
    key: K,
    value: TWhereInput[K] | undefined
  ): this {
    if (value !== undefined && value !== null && value !== '') {
      this.where[key] = value;
    }
    return this;
  }
}
