export class CourierQueryBuilder {
  private where: any = {};

  withApprovalStatus(status?: string) {
    if (status) {
      this.where.approvalStatus = status;
    }
    return this;
  }

  withStatus(status?: string) {
    if (status) {
      this.where.status = status;
    }
    return this;
  }

  withSearch(search?: string) {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this;
  }

  build() {
    return this.where;
  }
}